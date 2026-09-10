// lib/cron/weekly-payment-update.ts
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek } from 'date-fns';

export async function updateWeeklyPayments() {
  try {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Récupérer tous les hôtes avec leurs réservations
    const hosts = await prisma.user.findMany({
      where: { role: 'HOST' },
      include: {
        hostPayment: true,
        reservations: {
          where: {
            status: 'COMPLETED',
            checkIn: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
        },
      },
    });

    for (const host of hosts) {
      const totalAmount = host.reservations.reduce(
        (sum, r) => sum + r.totalPrice,
        0
      );
      const reservationsCount = host.reservations.length;

      if (totalAmount > 0 && host.hostPayment) {
        // Mettre à jour les paiements
        await fetch('/api/admin/payments/update-weekly', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hostId: host.id,
            amount: totalAmount,
            reservationsCount,
          }),
        });
      }
    }

    console.log('✅ Paiements hebdomadaires mis à jour');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter chaque lundi à 00:00
// schedule.scheduleJob('0 0 * * 1', updateWeeklyPayments);