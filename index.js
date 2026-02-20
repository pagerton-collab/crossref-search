require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// API key check
app.use((req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Normalize helper
function norm(s) {
  if (!s) return '';
  return s.toString().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', details: err.message });
  }
});

// TWO‑HOP EXPANSION SEARCH (your exact rule)
app.get('/search', async (req, res) => {
  const q = (req.query.query || '').trim();
  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  const sql = `
    WITH cleaned AS (
      SELECT
        id,
        reference_number,
        make,
        part_number,
        company,
        description,
        REGEXP_REPLACE(LOWER(reference_number), '[^a-z0-9]+', '', 'g') AS ref_clean,
        REGEXP_REPLACE(LOWER(part_number), '[^a-z0-9]+', '', 'g') AS part_clean
      FROM access_parts
    ),

    seed AS (
      SELECT REGEXP_REPLACE(LOWER($1), '[^a-z0-9]+', '', 'g') AS key
    ),

    -- FIRST PASS: rows matching the input
    first_hop_rows AS (
      SELECT *
      FROM cleaned
      WHERE ref_clean = (SELECT key FROM seed)
         OR part_clean = (SELECT key FROM seed)
    ),

    -- Collect ALL unique numbers from first hop + original
    first_hop_numbers AS (
      SELECT ref_clean AS num FROM first_hop_rows
      UNION
      SELECT part_clean AS num FROM first_hop_rows
      UNION
      SELECT key AS num FROM seed
    ),

    -- SECOND PASS: for each number, find rows where ref/part matches
    second_hop_rows AS (
      SELECT DISTINCT c.*
      FROM cleaned c
      JOIN first_hop_numbers n
        ON c.ref_clean = n.num
        OR c.part_clean = n.num
    )

    SELECT DISTINCT
      reference_number,
      make,
      part_number,
      company,
      description
    FROM second_hop_rows
    ORDER BY reference_number, make, part_number, company;
  `;

  try {
    const { rows } = await pool.query(sql, [q]);
    res.json({ query: q, count: rows.length, results: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Query failed', details: err.message });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
