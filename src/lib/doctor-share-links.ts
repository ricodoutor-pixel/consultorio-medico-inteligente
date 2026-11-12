/** Links pessoais do médico (consulta direta com ele e convite a colegas), sempre com o código permanente. */
export function doctorShareLinks(origin: string, doctorId: string, referralCode: string) {
  const base = origin.replace(/\/+$/, "");
  const doctor = encodeURIComponent(doctorId);
  const ref = encodeURIComponent(referralCode);
  return {
    chat: `${base}/consulta/consulta_chat?doctor=${doctor}&ref=${ref}`,
    video: `${base}/consulta/consulta_video?doctor=${doctor}&ref=${ref}`,
    colleague: `${base}/cadastro-profissional?ref=${ref}`,
  };
}
