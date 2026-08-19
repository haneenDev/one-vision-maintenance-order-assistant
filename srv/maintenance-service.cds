using { maintenance.assistant as db } from '../db/schema';

/**
 * Service consumed by the maintenance supervisor app.
 * Exposes maintenance orders together with an automatically computed
 * priority (Urgent / High / Medium / Low) so the supervisor can quickly
 * see which order needs attention before another one.
 */
service MaintenanceService @(path: '/maintenance') {

    // Full CRUD entity - priority & priorityScore are recalculated
    // server-side on every create/update, see srv/maintenance-service.js
    entity MaintenanceOrders as projection on db.MaintenanceOrders;

    // Read-only, ready-to-consume list for the supervisor:
    // most urgent order first.
    @readonly
    entity PrioritizedOrders as
        select from db.MaintenanceOrders
        order by
            priorityScore desc,
            scheduledStart asc;
}
