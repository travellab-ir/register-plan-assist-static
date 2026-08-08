import Checker from 'src/business/constraints/Checker';
import Preplan from 'src/business/preplan/Preplan';
import ConstraintSystem, { SuperFlightLeg } from 'src/business/constraints/ConstraintSystem';
import { ConstraintTemplate } from 'src/business/master-data';

export default class AirportSequenceRestrictionOnFlightsChecker extends Checker {
  constructor(preplan: Preplan, constraintSystem: ConstraintSystem, constraintTemplate: ConstraintTemplate) {
    super(preplan, constraintSystem, constraintTemplate);
  }

  check(): void {
    Object.keys(this.constraintSystem.flightLegEventsByAircraftRegisterId).forEach(aircraftRegisterId => {
      const openSuperFlightLegs: SuperFlightLeg[] = [];
      let lastSuperFlightLeg: SuperFlightLeg | undefined;
      this.constraintSystem.flightLegEventsByAircraftRegisterId[aircraftRegisterId].forEach(e => {
        if (e.starting) {
          if (lastSuperFlightLeg) {
            // Both copies are the shifted (second) round of the same underlying pair, so the
            // gap was already checked once when the first-round copies met.
            if (!(e.superFlightLeg.secondRound && lastSuperFlightLeg.secondRound) && lastSuperFlightLeg.flightLeg.arrivalAirport !== e.superFlightLeg.flightLeg.departureAirport) {
              this.issueObjection(
                e.superFlightLeg.flightLeg,
                'ERROR',
                12345,
                constraintMarker =>
                  `${constraintMarker}: ${e.superFlightLeg.flightLeg.marker} departure does not match the arrival of ${lastSuperFlightLeg!.flightLeg.label}, ${
                    lastSuperFlightLeg!.flightLeg.departureAirport.name
                  }-${lastSuperFlightLeg!.flightLeg.arrivalAirport.name}.`
              );
            }
            lastSuperFlightLeg = undefined;
          }
          openSuperFlightLegs.push(e.superFlightLeg);
        } else {
          openSuperFlightLegs.remove(e.superFlightLeg);
          if (openSuperFlightLegs.length === 0) lastSuperFlightLeg = e.superFlightLeg;
        }
      });
    });
  }
}
