import Checker from 'src/business/constraints/Checker';
import Preplan from 'src/business/preplan/Preplan';
import ConstraintSystem, { SuperFlightLeg } from 'src/business/constraints/ConstraintSystem';
import { Airport, Constraint } from 'src/business/master-data';
import { RouteSequenceRestrictionOnAirportsConstraintData } from 'src/business/master-data/Constraint';
import FlightLeg from 'src/business/flight/FlightLeg';

export default class RouteSequenceRestrictionOnAirportsChecker extends Checker {
  private data: RouteSequenceRestrictionOnAirportsConstraintData;

  constructor(preplan: Preplan, constraintSystem: ConstraintSystem, constraint: Constraint) {
    super(preplan, constraintSystem, constraint.template, constraint);
    this.data = constraint.data as RouteSequenceRestrictionOnAirportsConstraintData;
  }

  check(): void {
    Object.keys(this.constraintSystem.flightLegEventsByAircraftRegisterId).forEach(aircraftRegisterId => {
      const openSuperFlightLegs: SuperFlightLeg[] = [];
      let lastSuperFlightLeg: SuperFlightLeg | undefined;
      this.constraintSystem.flightLegEventsByAircraftRegisterId[aircraftRegisterId].forEach(e => {
        if (e.starting) {
          if (lastSuperFlightLeg) {
            // Both copies are the shifted (second) round of the same underlying pair, so the
            // sequence was already checked once when the first-round copies met.
            if (
              !(e.superFlightLeg.secondRound && lastSuperFlightLeg.secondRound) &&
              this.touchesAirport(lastSuperFlightLeg.flightLeg, this.data.nextAirport) &&
              this.touchesAirport(e.superFlightLeg.flightLeg, this.data.airport)
            ) {
              this.issueObjection(
                e.superFlightLeg.flightLeg,
                'ERROR',
                12345,
                constraintMarker =>
                  `${constraintMarker}: ${e.superFlightLeg.flightLeg.marker} can not be planned right after ${lastSuperFlightLeg!.flightLeg.label}, ${
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

  private touchesAirport(flightLeg: FlightLeg, airport: Airport): boolean {
    return flightLeg.departureAirport === airport || flightLeg.arrivalAirport === airport;
  }
}
