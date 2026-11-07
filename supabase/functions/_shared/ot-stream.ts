/** Accumulate SSE lines across arbitrary transport chunks. */
export function createOtStreamParser() {
  let buffer = "";
  return (chunk: string): string => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    let text = "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload);
        if (event.error) throw new Error("A resposta foi interrompida. Tente novamente ou chame a equipe.");
        const delta = event.choices?.[0]?.delta?.content;
        if (typeof delta === "string") text += delta;
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
      }
    }
    return text;
  };
}

export function canDownloadOtReport(status: string) {
  return status === "approved";
}