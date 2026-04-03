const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const serverless = require('serverless-http');

const app = express();

// ⚠️ Vercel uses /tmp for writable storage (temporary only)
const DATA_DIR = '/tmp/data';
const PROPOSALS_FILE = path.join(DATA_DIR, 'proposals.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ==============================
// 📦 FILE HELPERS
// ==============================

async function ensureFile() {
    try {
        await fs.ensureFile(PROPOSALS_FILE);
    } catch (err) {
        console.error("File ensure error:", err);
    }
}

async function getProposals() {
    try {
        await ensureFile();
        const data = await fs.readJson(PROPOSALS_FILE);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

async function saveProposals(proposals) {
    try {
        await ensureFile();
        await fs.writeJson(PROPOSALS_FILE, proposals, { spaces: 2 });
    } catch (error) {
        console.error("Save error:", error);
    }
}

// ==============================
// 🚀 API ROUTES
// ==============================

// GET ALL
app.get('/api/proposals', async (req, res) => {
    try {
        const proposals = await getProposals();
        res.json(proposals);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch proposals' });
    }
});

// CREATE
app.post('/api/proposals', async (req, res) => {
    try {
        const proposalData = req.body;

        const proposals = await getProposals();

        const lastNumber = proposals.length > 0
            ? proposals[proposals.length - 1].proposal_no
            : 2625;

        const newProposal = {
            id: uuidv4(),
            proposal_no: lastNumber + 1,
            ...proposalData,
            createdAt: new Date().toISOString()
        };

        proposals.push(newProposal);
        await saveProposals(proposals);

        res.json({
            success: true,
            proposal: newProposal
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create proposal' });
    }
});

// GET SINGLE
app.get('/api/proposals/:id', async (req, res) => {
    try {
        const proposals = await getProposals();
        const proposal = proposals.find(p => p.id === req.params.id);

        if (!proposal) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        res.json(proposal);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch proposal' });
    }
});

// UPDATE
app.put('/api/proposals/:id', async (req, res) => {
    try {
        const proposals = await getProposals();
        const index = proposals.findIndex(p => p.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        proposals[index] = {
            ...proposals[index],
            ...req.body,
            updatedAt: new Date().toISOString()
        };

        await saveProposals(proposals);

        res.json({
            success: true,
            proposal: proposals[index]
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to update proposal' });
    }
});

// DELETE
app.delete('/api/proposals/:id', async (req, res) => {
    try {
        const proposals = await getProposals();
        const filtered = proposals.filter(p => p.id !== req.params.id);

        await saveProposals(filtered);

        res.json({
            success: true,
            message: 'Proposal deleted'
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to delete proposal' });
    }
});

// DOWNLOAD JSON
app.get('/api/download-proposals', async (req, res) => {
    try {
        const proposals = await getProposals();

        res.setHeader('Content-Disposition', 'attachment; filename=proposals.json');
        res.setHeader('Content-Type', 'application/json');

        res.send(JSON.stringify(proposals, null, 2));
    } catch (error) {
        res.status(500).json({ error: 'Download failed' });
    }
});

// ==============================
// 🚀 EXPORT FOR VERCEL
// ==============================

module.exports = serverless(app);