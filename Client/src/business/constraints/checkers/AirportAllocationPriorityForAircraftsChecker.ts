import Checker from 'src/business/constraints/Checker';
import Preplan from 'src/business/preplan/Preplan';
import ConstraintSystem from 'src/business/constraints/ConstraintSystem';
import { Constraint } from 'src/business/master-data';
import { AirportAllocationPriorityForAircraftsConstraintData } from 'src/business/master-data/Constraint';

export default class AirportAllocationPriorityForAircraftsChecker extends Checker {
  private data: AirportAllocationPriorityForAircraftsConstraintData;

  constructor(preplan: Preplan, constraintSystem: ConstraintSystem, constraint: Constraint) {
    super(preplan, constraintSystem, constraint.template, constraint);
    this.data = constraint.data as AirportAllocationPriorityForAircraftsConstraintData;
  }

  check(): void {
    this.preplan.flightLegs.forEach(f => {
      if (!f.aircraftRegister) return;
      if (!this.data.airports.includes(f.departureAirport) && !this.data.airports.includes(f.arrivalAirport)) return;

      // The registers this flight could have been assigned to, per its own day flight requirement's scope.
      const candidateRegisters = f.dayFlightRequirement.aircraftSelection.aircraftRegisters;

      const usedRank = this.data.aircraftRegisters.findIndex(a => a.id === f.aircraftRegister!.id);
      const higherPriorityCandidates = this.data.aircraftRegisters
        .slice(0, usedRank === -1 ? this.data.aircraftRegisters.length : usedRank)
        .filter(preferred => candidateRegisters.some(c => c.id === preferred.id));

      if (higherPriorityCandidates.length === 0) return;
      this.issueObjection(
        f,
        'WARNING',
        12345,
        constraintMarker => `${f.marker} should preferably use ${higherPriorityCandidates[0].name} over ${f.aircraftRegister!.name} due to ${constraintMarker}.`
      );
    });
  }
}
