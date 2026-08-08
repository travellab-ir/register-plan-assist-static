import Checker from 'src/business/constraints/Checker';
import Preplan from 'src/business/preplan/Preplan';
import ConstraintSystem, { SuperFlightLeg } from 'src/business/constraints/ConstraintSystem';
import { ConstraintTemplate } from 'src/business/master-data';

export default class NoConflictionOnFlightsChecker extends Checker {
  constructor(preplan: Preplan, constraintSystem: ConstraintSystem, constraintTemplate: ConstraintTemplate) {
    super(preplan, constraintSystem, constraintTemplate);
  }

  check(): void {
    Object.keys(this.constraintSystem.flightLegEventsByAircraftRegisterId).forEach(aircraftRegisterId => {
      const openSuperFlightLegs: SuperFlightLeg[] = [];
      this.constraintSystem.flightLegEventsByAircraftRegisterId[aircraftRegisterId].forEach(e => {
        if (e.starting) {
          openSuperFlightLegs.forEach(s => {
            // Both copies are the shifted (second) round of the same underlying pair, so the
            // conflict was already reported once when the first-round copies overlapped.
            if (e.superFlightLeg.secondRound && s.secondRound) return;
            this.issueObjection(
              e.superFlightLeg.flightLeg,
              'ERROR',
              12345,
              constraintMarker =>
                `${constraintMarker} and ${e.superFlightLeg.flightLeg.marker} conflicts with ${s.flightLeg.label}, ${s.flightLeg.departureAirport.name}-${s.flightLeg.arrivalAirport.name}.`
            );
          });
          openSuperFlightLegs.push(e.superFlightLeg);
        } else {
          openSuperFlightLegs.remove(e.superFlightLeg);
        }
      });
    });
  }
}
