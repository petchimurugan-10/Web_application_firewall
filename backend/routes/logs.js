// routes/logs.js - API route for serving WAF logs by parsing the Nginx error log
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const logFilePath = path.join(__dirname, '..', 'nginx_logs', 'error.log');

// This function uses multiple simple regexes to be more robust
const parseLogLine = (line) => {
  if (!line.includes('ModSecurity: Access denied')) {
    return null;
  }

  const timestampMatch = line.match(/^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})/);
  const ruleIdMatch = line.match(/ \[id "(\d+)"\]/);
  const msgMatch = line.match(/ \[msg "(.*?)"\]/);
  const severityMatch = line.match(/\[severity "(\d+)"\]/);
  const clientIpMatch = line.match(/\[client ([\d\.]+)\]/);
  const uriMatch = line.match(/\[uri "(.*?)"\]/);
  const methodMatch = line.match(/request: "(\w+)/);
  const statusMatch = line.match(/Access denied with code (\d+)/);


  return {
    timestamp: timestampMatch ? timestampMatch[1] : 'N/A',
    ruleId: ruleIdMatch ? ruleIdMatch[1] : 'N/A',
    message: msgMatch ? msgMatch[1] : 'No message found',
    severity: severityMatch ? severityMatch[1] : 'N/A',
    clientIp: clientIpMatch ? clientIpMatch[1] : 'N/A',
    uri: uriMatch ? uriMatch[1] : 'N/A',
    method: methodMatch ? methodMatch[1] : 'N/A',
    status: statusMatch ? statusMatch[1] : 'N/A',
  };
};

router.get('/', (req, res) => {
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.json([]);
      }
      console.error('Error reading log file:', err);
      return res.status(500).json({ error: 'Failed to read WAF logs' });
    }

    const allLines = data.trim().split('\n');
    const matchedLogs = [];

    allLines.forEach(line => {
      const parsedLog = parseLogLine(line);
      if (parsedLog) {
        matchedLogs.push(parsedLog);
      }
    });

    // Return the most recent logs first
    res.json(matchedLogs.reverse());
  });
});

module.exports = router;
