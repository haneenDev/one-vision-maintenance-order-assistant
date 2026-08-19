const cds = require('@sap/cds');

// Points assigned to each risk/impact level
const LEVEL_SCORE = { HIGH: 3, MEDIUM: 2, LOW: 1 };

// How much each factor weighs in the final score.
// Safety risk matters the most, then equipment criticality, then production impact.
const WEIGHTS = {
  safetyRisk: 3,
  equipmentCriticality: 2,
  productionImpact: 1
};

// Score thresholds used to translate the weighted total into a label.
// Range without an "Urgent" override goes from 6 (Low/Low/Low) to 15 (High/Med/High).
const HIGH_THRESHOLD = 13;
const MEDIUM_THRESHOLD = 9;

function normalize(value) {
  return String(value || '').trim().toUpperCase();
}

/**
 * Calculates the priority label + numeric score for one maintenance order.
 * @param {{equipmentCriticality?:string, safetyRisk?:string, productionImpact?:string}} order
 * @returns {{priority:string, priorityScore:number}}
 */
function calculatePriority(order) {
  const safetyRisk = normalize(order.safetyRisk);

  // Any high safety risk automatically makes the order Urgent,
  // no matter what the other two factors are.
  if (safetyRisk === 'HIGH') {
    return { priority: 'Urgent', priorityScore: 100 };
  }

  const equipmentCriticality = normalize(order.equipmentCriticality);
  const productionImpact = normalize(order.productionImpact);

  const safetyScore = LEVEL_SCORE[safetyRisk] || LEVEL_SCORE.LOW;
  const equipmentScore = LEVEL_SCORE[equipmentCriticality] || LEVEL_SCORE.LOW;
  const productionScore = LEVEL_SCORE[productionImpact] || LEVEL_SCORE.LOW;

  const priorityScore =
    safetyScore * WEIGHTS.safetyRisk +
    equipmentScore * WEIGHTS.equipmentCriticality +
    productionScore * WEIGHTS.productionImpact;

  let priority = 'Low';
  if (priorityScore >= HIGH_THRESHOLD) priority = 'High';
  else if (priorityScore >= MEDIUM_THRESHOLD) priority = 'Medium';

  return { priority, priorityScore };
}

module.exports = cds.service.impl(async function () {
  const { MaintenanceOrders } = this.entities;

  // Recalculate priority + priorityScore for every create/update,
  // ignoring whatever the client might have sent for those two fields.
  this.before(['CREATE', 'UPDATE'], MaintenanceOrders, (req) => {
    const rows = Array.isArray(req.data) ? req.data : [req.data];
    for (const row of rows) {
      const { priority, priorityScore } = calculatePriority(row);
      row.priority = priority;
      row.priorityScore = priorityScore;
    }
  });

  // If the caller did not ask for a specific sort order, show the
  // most urgent orders first by default - this is what the supervisor needs.
  this.after('READ', MaintenanceOrders, (results, req) => {
    if (Array.isArray(results) && !req.query.SELECT.orderBy) {
      results.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
    }
  });
});

// Exported for unit testing.
module.exports.calculatePriority = calculatePriority;
