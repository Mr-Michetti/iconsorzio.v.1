import { PrismaDoBackup } from 'prisma-do-backup';
import { prisma } from '@/lib/db';

export default async function handler(req, res) {
    // Verifica che la richiesta venga da Vercel Cron
    const authHeader = req.headers.authorization;
    
    // In produzione, verifica il token di autorizzazione
    if (process.env.NODE_ENV === 'production') {
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    // Accetta solo richieste GET (Vercel Cron usa GET)
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const backup = new PrismaDoBackup(prisma, {
            environment: process.env.NODE_ENV || 'production',
            retention: {
                daily: 7,      // Mantieni 7 backup giornalieri
                weekly: 4,     // Mantieni 4 backup settimanali
                monthly: 3     // Mantieni 3 backup mensili
            }
        });

        // Esegui il backup
        const result = await backup.backup();

        // Esegui pulizia dei vecchi backup
        const cleanup = await backup.cleanup({ dryRun: false });

        console.log(`[CRON BACKUP] Backup completato: ${result.filename}`);
        console.log(`[CRON BACKUP] Backup eliminati: ${cleanup.deleted?.length || 0}`);

        res.status(200).json({
            success: true,
            message: 'Backup completato con successo',
            backup: {
                filename: result.filename,
                size: result.size,
                tables: result.tables
            },
            cleanup: {
                deleted: cleanup.deleted?.length || 0
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[CRON BACKUP] Errore durante il backup:', error);
        
        res.status(500).json({
            success: false,
            error: 'Errore durante il backup',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// Configurazione per aumentare il timeout (Vercel Pro/Enterprise)
export const config = {
    maxDuration: 60 // 60 secondi di timeout
};
