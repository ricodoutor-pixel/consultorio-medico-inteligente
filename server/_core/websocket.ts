import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

interface UserSession {
  userId: string;
  userType: "patient" | "specialist" | "pharmacy";
  country: string;
  isOnline: boolean;
  socketId: string;
  lastActivity: Date;
}

interface ConsultationSession {
  consultationId: string;
  patientId: string;
  specialistId: string;
  status: "waiting" | "active" | "completed";
  startTime: Date;
  participants: string[];
}

class WebSocketManager {
  private io: SocketIOServer;
  private userSessions: Map<string, UserSession> = new Map();
  private consultationSessions: Map<string, ConsultationSession> = new Map();
  private onlineStats = {
    totalOnline: 0,
    specialistsOnline: 0,
    patientsOnline: 0,
    pharmaciesOnline: 0,
    activeConsultations: 0,
  };

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket: Socket) => {
      console.log(`[WS] User connected: ${socket.id}`);

      // User goes online
      socket.on("user:online", (data: { userId: string; userType: string; country: string }) => {
        this.handleUserOnline(socket, data);
      });

      // User goes offline
      socket.on("disconnect", () => {
        this.handleUserOffline(socket);
      });

      // Specialist updates status
      socket.on("specialist:status", (data: { specialistId: string; status: "online" | "offline" | "busy" }) => {
        this.handleSpecialistStatus(socket, data);
      });

      // New consultation request
      socket.on("consultation:request", (data: { patientId: string; specialistId: string; consultationId: string }) => {
        this.handleConsultationRequest(socket, data);
      });

      // Consultation started
      socket.on("consultation:start", (data: { consultationId: string }) => {
        this.handleConsultationStart(socket, data);
      });

      // Chat message in consultation
      socket.on("consultation:message", (data: { consultationId: string; message: string; senderId: string }) => {
        this.handleConsultationMessage(socket, data);
      });

      // Consultation ended
      socket.on("consultation:end", (data: { consultationId: string }) => {
        this.handleConsultationEnd(socket, data);
      });

      // Referral notification
      socket.on("referral:new", (data: { referrerId: string; referredId: string; type: string }) => {
        this.handleNewReferral(socket, data);
      });

      // Leaderboard update request
      socket.on("leaderboard:request", () => {
        this.handleLeaderboardRequest(socket);
      });

      // Online users by country request
      socket.on("users:byCountry", () => {
        this.handleUsersByCountry(socket);
      });
    });
  }

  private handleUserOnline(socket: Socket, data: { userId: string; userType: string; country: string }) {
    const session: UserSession = {
      userId: data.userId,
      userType: data.userType as "patient" | "specialist" | "pharmacy",
      country: data.country,
      isOnline: true,
      socketId: socket.id,
      lastActivity: new Date(),
    };

    this.userSessions.set(data.userId, session);
    this.updateOnlineStats();

    console.log(`[WS] ${data.userType} online: ${data.userId} from ${data.country}`);

    // Broadcast online status to all
    this.io.emit("stats:update", this.onlineStats);

    // Notify specialists that a new patient is online
    if (data.userType === "patient") {
      this.io.emit("patients:update", { action: "online", userId: data.userId, country: data.country });
    }

    // Notify about specialist online status
    if (data.userType === "specialist") {
      this.io.emit("specialists:update", {
        action: "online",
        userId: data.userId,
        country: data.country,
        status: "available",
      });
    }
  }

  private handleUserOffline(socket: Socket) {
    // Find and remove user session
    const entries = Array.from(this.userSessions.entries());
    for (const [userId, session] of entries) {
      if (session.socketId === socket.id) {
        this.userSessions.delete(userId);
        this.updateOnlineStats();

        console.log(`[WS] User offline: ${userId}`);

        // Broadcast offline status
        this.io.emit("stats:update", this.onlineStats);

        if (session.userType === "specialist") {
          this.io.emit("specialists:update", { action: "offline", userId });
        }
        break;
      }
    }
  }

  private handleSpecialistStatus(socket: Socket, data: { specialistId: string; status: "online" | "offline" | "busy" }) {
    const session = this.userSessions.get(data.specialistId);
    if (session) {
      session.lastActivity = new Date();

      // Broadcast status to all
      this.io.emit("specialist:statusChanged", {
        specialistId: data.specialistId,
        status: data.status,
        timestamp: new Date(),
      });

      console.log(`[WS] Specialist ${data.specialistId} status: ${data.status}`);
    }
  }

  private handleConsultationRequest(socket: Socket, data: { patientId: string; specialistId: string; consultationId: string }) {
    const specialist = this.userSessions.get(data.specialistId);

    if (specialist && specialist.isOnline) {
      // Send alert to specialist
      this.io.to(specialist.socketId).emit("consultation:alert", {
        consultationId: data.consultationId,
        patientId: data.patientId,
        timestamp: new Date(),
      });

      console.log(`[WS] Consultation request sent to specialist ${data.specialistId}`);
    } else {
      // Specialist offline - notify patient
      socket.emit("consultation:specialistOffline", { specialistId: data.specialistId });
    }
  }

  private handleConsultationStart(socket: Socket, data: { consultationId: string }) {
    const consultation = this.consultationSessions.get(data.consultationId);

    if (consultation) {
      consultation.status = "active";
      consultation.startTime = new Date();
      this.onlineStats.activeConsultations++;

      // Notify both participants
      this.io.emit("consultation:started", {
        consultationId: data.consultationId,
        timestamp: new Date(),
      });

      console.log(`[WS] Consultation started: ${data.consultationId}`);
    }
  }

  private handleConsultationMessage(socket: Socket, data: { consultationId: string; message: string; senderId: string }) {
    const consultation = this.consultationSessions.get(data.consultationId);

    if (consultation) {
      // Broadcast message to both participants
      this.io.emit("consultation:message", {
        consultationId: data.consultationId,
        message: data.message,
        senderId: data.senderId,
        timestamp: new Date(),
      });

      console.log(`[WS] Message in consultation ${data.consultationId}`);
    }
  }

  private handleConsultationEnd(socket: Socket, data: { consultationId: string }) {
    const consultation = this.consultationSessions.get(data.consultationId);

    if (consultation) {
      consultation.status = "completed";
      this.onlineStats.activeConsultations--;

      // Notify both participants
      this.io.emit("consultation:ended", {
        consultationId: data.consultationId,
        duration: new Date().getTime() - consultation.startTime.getTime(),
        timestamp: new Date(),
      });

      this.consultationSessions.delete(data.consultationId);
      console.log(`[WS] Consultation ended: ${data.consultationId}`);
    }
  }

  private handleNewReferral(socket: Socket, data: { referrerId: string; referredId: string; type: string }) {
    const referrer = this.userSessions.get(data.referrerId);

    // Notify referrer about new referral
    if (referrer && referrer.isOnline) {
      this.io.to(referrer.socketId).emit("referral:earned", {
        referredId: data.referredId,
        type: data.type,
        commission: data.type === "patient" ? 10 : 50, // Example values
        timestamp: new Date(),
      });
    }

    console.log(`[WS] New referral: ${data.referrerId} referred ${data.referredId}`);
  }

  private handleLeaderboardRequest(socket: Socket) {
    // TODO: Query database for top referrers
    const leaderboard: any[] = [
      { rank: 1, userId: "user123", referrals: 45, earnings: 450 },
      { rank: 2, userId: "user456", referrals: 38, earnings: 380 },
      { rank: 3, userId: "user789", referrals: 32, earnings: 320 },
    ];

    socket.emit("leaderboard:update", leaderboard);
  }

  private handleUsersByCountry(socket: Socket) {
    const usersByCountry: Record<string, number> = {};
    const sessions = Array.from(this.userSessions.values());

    for (const session of sessions) {
      usersByCountry[session.country] = (usersByCountry[session.country] || 0) + 1;
    }

    socket.emit("users:byCountry", usersByCountry);
  }

  private updateOnlineStats() {
    this.onlineStats.totalOnline = this.userSessions.size;
    const sessions = Array.from(this.userSessions.values());
    this.onlineStats.specialistsOnline = sessions.filter((s) => s.userType === "specialist").length;
    this.onlineStats.patientsOnline = sessions.filter((s) => s.userType === "patient").length;
    this.onlineStats.pharmaciesOnline = sessions.filter((s) => s.userType === "pharmacy").length;
  }

  public getStats() {
    return this.onlineStats;
  }

  public getUserSessions() {
    const sessions = Array.from(this.userSessions.values());
    return sessions;
  }

  public getConsultationSessions() {
    const consultations = Array.from(this.consultationSessions.values());
    return consultations;
  }
}

export default WebSocketManager;
