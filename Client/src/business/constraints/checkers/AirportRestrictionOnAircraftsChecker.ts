import Checker from 'src/business/constraints/Checker';
import Preplan from 'src/business/preplan/Preplan';
import ConstraintSystem from 'src/business/constraints/ConstraintSystem';
import { Constraint } from 'src/business/master-data';
import { AirportRestrictionOnAircraftsConstraintData } from 'src/business/master-data/Constraint';
import PreplanAircraftRegister from 'src/business/preplan/PreplanAircraftRegister';

export default class AirportRestrictionOnAircraftsChecker extends Checker {
  private data: AirportRestrictionOnAircraftsConstraintData;

  constructor(preplan: Preplan, constraintSystem: ConstraintSystem, constraint: Constraint) {
    super(preplan, constraintSystem, constraint.template, constraint);
    this.data = constraint.data as AirportRestrictionOnAircraftsConstraintData;
  }

  check(): void {
    const includesRestrictedRegister = (aircraftRegisters: readonly PreplanAircraftRegister[]) => aircraftRegisters.some(a => a.id === this.data.aircraftRegister.id);

    this.preplan.flightLegs.forEach(f => {
      if (!f.aircraftRegister || f.aircraftRegister.id !== this.data.aircraftRegister.id) return;
      if (this.data.airports.includes(f.departureAirport) || this.data.airports.includes(f.arrivalAirport)) return;
      this.issueObjection(f, 'ERROR', 12345, constraintMarker => `${f.marker} can not be planned with ${f.aircraftRegister!.name} due to ${constraintMarker}.`);
    });

    this.preplan.flightRequirements.forEach(r => {
      if ([r.route[0].departureAirport, ...r.route.map(l => l.arrivalAirport)].some(a => this.data.airports.includes(a))) return;
      if (includesRestrictedRegister(r.aircraftSelection.aircraftRegisters)) {
        this.issueObjection(r, 'WARNING', 12345, constraintMarker => `${r.marker} may violate ${constraintMarker}.`);
      }
      r.days.forEach(d => {
        if (includesRestrictedRegister(d.aircraftSelection.aircraftRegisters)) {
          this.issueObjection(d, 'WARNING', 12345, constraintMarker => `${d.marker} may violate ${constraintMarker}.`);
        }
      });
    });
  }
}
