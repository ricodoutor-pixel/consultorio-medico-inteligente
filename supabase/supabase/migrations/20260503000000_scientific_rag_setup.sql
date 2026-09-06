-- Ativar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de Artigos Científicos para RAG
CREATE TABLE IF NOT EXISTS scientific_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  abstract TEXT,
  content TEXT,
  doi TEXT,
  authors TEXT[],
  publication_date DATE,
  embedding VECTOR(1536), -- Compatível com OpenAI ou similar
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Anamnese Inteligente
CREATE TABLE IF NOT EXISTS ai_anamnesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id),
  symptoms TEXT,
  medical_history TEXT,
  scientific_rationale TEXT, -- Onde a Brisa injeta as evidências do RAG
  suggested_cannabinoids TEXT[],
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Função de busca semântica
CREATE OR REPLACE FUNCTION match_scientific_articles (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.id,
    sa.title,
    sa.content,
    1 - (sa.embedding <=> query_embedding) AS similarity
  FROM scientific_articles sa
  WHERE 1 - (sa.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
