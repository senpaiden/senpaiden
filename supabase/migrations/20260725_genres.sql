CREATE TABLE IF NOT EXISTS genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the core normalized genres
INSERT INTO genres (name, slug) VALUES 
('Action', 'action'),
('Romance', 'romance'),
('Drama', 'drama'),
('Sci-Fi', 'sci-fi'),
('Isekai', 'isekai'),
('Fantasy', 'fantasy'),
('Supernatural', 'supernatural'),
('Mature', 'mature'),
('BL', 'bl'),
('GL', 'gl'),
('School Life', 'school-life'),
('Slice of Life', 'slice-of-life'),
('Comedy', 'comedy'),
('Horror', 'horror'),
('Mystery', 'mystery'),
('Psychological', 'psychological'),
('Thriller', 'thriller'),
('Tragedy', 'tragedy'),
('Historical', 'historical'),
('Sports', 'sports'),
('Webtoon', 'webtoon')
ON CONFLICT (name) DO NOTHING;
