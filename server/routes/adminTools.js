const express = require('express');
const router = express.Router();
const pool = require('../db'); // or 'db' if your connection is named that
const { Parser } = require('json2csv');

console.log("✅ [adminTools.js] This file loaded.");

// ✅ GET /api/admin-tools/queries
router.get('/queries', async (req, res) => {
  try {
    const query = `
      SELECT 
        fld_id, 
        fld_label, 
        fld_notes, 
        fld_where_clause IS NOT NULL AS has_where,
        fld_where_clause
      FROM tbl_admin_queries
      ORDER BY fld_id;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching admin queries:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch admin queries', detail: err.message });
  }
});

// ✅ GET /api/admin-tools/queries/:id/run
router.get('/queries/:id/run', async (req, res) => {
  const id = req.params.id;
  const userValue = req.query.value || '';

  try {
    const { rows } = await pool.query(
      'SELECT fld_sql, fld_where_clause FROM tbl_admin_queries WHERE fld_id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Query not found' });
    }

    const { fld_sql, fld_where_clause } = rows[0];

    // ✅ Special safe SELECT * FROM <table>
    if (
      fld_where_clause === 'table_name = $1' &&
      fld_sql.trim().toUpperCase() === 'SELECT * FROM' &&
      userValue
    ) {
      const safeTable = userValue.replace(/[^a-zA-Z0-9_]/g, '');
      const finalQuery = `SELECT * FROM ${safeTable}`;
      const result = await pool.query(finalQuery);

      return res.json({
        success: true,
        columns: result.fields.map(f => f.name),
        rows: result.rows,
        rowCount: result.rowCount,
        sql: { text: finalQuery, values: [] }
      });
    }

    // ✅ Normal stored query
    let finalQuery = fld_sql;
    let values = [];
    let result;

    if (fld_where_clause) {
      finalQuery += ' WHERE ' + fld_where_clause;
      values = [userValue];
      result = await pool.query(finalQuery, values);
    } else {
      result = await pool.query(finalQuery);
    }

    res.json({
      success: true,
      columns: result.fields?.map(f => f.name) || [],
      rows: result.rows || [],
      rowCount: result.rowCount || 0,
      sql: { text: finalQuery, values: values }
    });

  } catch (err) {
    console.error('Error running stored query:', err);
    res.status(500).json({ success: false, error: 'Failed to run stored query', detail: err.message });
  }
});

// ✅ POST /api/admin-tools/queries/raw
router.post('/queries/raw', async (req, res) => {
  const { query } = req.body;
  console.log("✅ [POST /queries/raw] req.body:", req.body);

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, error: 'No valid query provided' });
  }

  try {
    const result = await pool.query(query);

    res.json({
      success: true,
      columns: result.fields?.map(f => f.name) || [],
      rows: result.rows || [],
      rowCount: result.rowCount || 0,
      sql: { text: query, values: [] }
    });
  } catch (err) {
    console.error('Error executing raw query:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to execute query',
      detail: err.message,
      sql: { text: query, values: [] }
    });
  }
});

// ✅ POST /api/admin-tools/export-csv
router.post('/export-csv', async (req, res) => {
  const { columns, rows, filename = 'query_results.csv' } = req.body;

  if (!Array.isArray(columns) || !Array.isArray(rows)) {
    return res.status(400).json({ success: false, error: 'Invalid columns or rows data' });
  }

  try {
    const parser = new Parser({ fields: columns });
    const csv = parser.parse(rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error('CSV export failed:', err);
    res.status(500).json({ success: false, error: 'Failed to generate CSV', detail: err.message });
  }
});

module.exports = router;
