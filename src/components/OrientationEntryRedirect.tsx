import { Navigate, useLocation, useParams } from "react-router-dom";
import { orientationEntryUrl } from "@/lib/orientation-navigation";

export function OrientationEntryRedirect() {
  const location = useLocation();
  const { sessionId } = useParams<{ sessionId?: string }>();
  return <Navigate to={orientationEntryUrl(location.search, sessionId, location.hash)} state={location.state} replace />;
}