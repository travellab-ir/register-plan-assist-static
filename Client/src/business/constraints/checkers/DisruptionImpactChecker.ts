import Checker from 'src/business/constraints/Checker';
import Preplan from 'src/business/preplan/Preplan';
import ConstraintSystem from 'src/business/constraints/ConstraintSystem';
import { ConstraintTemplate } from 'src/business/master-data';
import DisruptionEvent from 'src/business/preplan/DisruptionEvent';
import FlightLeg from 'src/business/flight/FlightLeg';

/**
 * [Non instantiable, like NoConflictionOnFlightsChecker]
 * Flags every flight leg whose aircraft register is unavailable because of an active
 * operational disruption (AOG, airport closure, etc.) overlapping the leg's actual time window.
 *
 * Severity:
 *  - ERROR   the leg's std/sta window fully or partially falls inside the disruption interval
 *            and the disruption has no known end yet (open AOG) -> definitely needs re-assignment.
 *  - WARNING the disruption already has a declared end, so the overlap might resolve itself
 *            once the real end time is confirmed, but it still needs the planner's attention.
 */
export default class DisruptionImpactChecker extends Checker {
  constructor(preplan: Preplan, constraintSystem: ConstraintSystem, constraintTemplate: ConstraintTemplate) {
    super(preplan, constraintSystem, constraintTemplate);
  }

  check(): void {
    const disruptionEvents = this.preplan.disruptionEvents;
    if (disruptionEvents.length === 0) return;

    // Group disruptions per aircraft register so each flight leg only has to scan
    // the disruptions of its own register, not the whole list.
    const disruptionsByRegisterId = disruptionEvents.groupBy(d => d.aircraftRegister.id);

    this.preplan.flightLegs.forEach(flightLeg => {
      if (!flightLeg.aircraftRegister) return;
      const registerDisruptions = disruptionsByRegisterId[flightLeg.aircraftRegister.id];
      if (!registerDisruptions) return;

      registerDisruptions
        .filter(d => d.overlaps(flightLeg.stdDateTime, flightLeg.staDateTime))
        .forEach(d => this.issueObjectionForOverlap(flightLeg, d));
    });
  }

  private issueObjectionForOverlap(flightLeg: FlightLeg, disruption: DisruptionEvent): void {
    const open = !disruption.endDateTime;
    this.issueObjection(
      flightLeg,
      open ? 'ERROR' : 'WARNING',
      12345,
      constraintMarker =>
        `${constraintMarker}: ${flightLeg.marker} is assigned to ${disruption.aircraftRegister.name}, which is unavailable due to ${disruption.reason.toLowerCase()}` +
        `${disruption.description ? ` (${disruption.description})` : ''} from ${disruption.startDateTime.toISOString()}` +
        `${disruption.endDateTime ? ` to ${disruption.endDateTime.toISOString()}` : ', with no confirmed end yet'}.`
    );
  }
}
