namespace maintenance.assistant;

using {
    cuid,
    managed
} from '@sap/cds/common';

entity MaintenanceOrders : cuid, managed {
    orderNumber           : String(20) not null;
    description           : String(255);
    status                : String(30);  // Open, InProgress, Completed, Cancelled
    orderType             : String(30);

    plantCode             : String(20);
    plantName             : String(100);
    location              : String(100);

    equipmentNumber       : String(30);
    equipmentDescription  : String(100);

    scheduledStart        : DateTime;
    scheduledEnd          : DateTime;

    workCenter            : String(30);
    planner               : String(100);

    // ---- Priority inputs (allowed values: High, Medium, Low) ----
    equipmentCriticality  : String(20);
    safetyRisk            : String(20);
    productionImpact      : String(20);

    // ---- Priority output, calculated by srv/maintenance-service.js ----
    // priority     : Urgent, High, Medium, Low
    // priorityScore: numeric score used to sort orders (higher = more urgent)
    priority              : String(20);
    priorityScore         : Integer;

    estimatedDowntimeHrs  : Decimal(9,2);
    downtimeCostPerHour   : Decimal(13,2);
    currency              : String(3);

    failureRiskScore      : Integer;
}
