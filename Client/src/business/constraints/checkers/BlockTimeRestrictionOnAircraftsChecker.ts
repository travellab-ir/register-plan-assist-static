import Checker from 'src/business/constraints/Checker';
import Preplan from 'src/business/preplan/Preplan';
import ConstraintSystem from 'src/business/constraints/ConstraintSystem';
import { Constraint } from 'src/business/master-data';
import { BlockTimeRestrictionOnAircraftsConstraintData } from 'src/business/master-data/Constraint';
import PreplanAircraftRegister from 'src/business/preplan/PreplanAircraftRegister';
import PreplanAircraftSelection from 'src/business/preplan/PreplanAircraftSelection';

export default class BlockTimeRestrictionOnAircraftsChecker extends Checker {
  private data: BlockTimeRestrictionOnAircraftsConstraintData;
  private aircraftRegisters: readonly PreplanAircraftRegister[];

  constructor(preplan: Preplan, constraintSystem: ConstraintSystem, constraint: Constraint) {
    super(preplan, constraintSystem, constraint.template, constraint);
    this.data = constraint.data as BlockTimeRestrictionOnAircraftsConstraintData;
    this.aircraftRegisters = new PreplanAircraftSelection(this.data.aircraftSelection, preplan.aircraftRegisters).aircraftRegisters;
  }

  check(): void {
    this.preplan.flightRequirements.forEach(r => {
      const commonCount = r.aircraftSelection.aircraftRegisters.filter(a => this.aircraftRegisters.includes(a)).length;
      if (commonCount === r.aircraftSelection.aircraftRegisters.length) {
        this.issueObjection(r, 'ERROR', 12345, constraintMarker => `${constraintMarker} is violated by ${r.marker}.`);
        return;
      }
      if (commonCount > 0) {
        this.issueObjection(r, 'WARNING', 12345, constraintMarker => `${constraintMarker} may be violated by ${r.marker}.`);
        return;
      }
      r.days.forEach(d => {
        const dayCommonCount = d.aircraftSelection.aircraftRegisters.filter(a => this.aircraftRegisters.includes(a)).length;
        if (dayCommonCount === d.aircraftSelection.aircraftRegisters.length) {
          this.issueObjection(d, 'ERROR', 12345, constraintMarker => `${constraintMarker} is violated by ${d.marker}.`);
          return;
        }
        //TODO: Refine this instantiation, this should probably be a WARNING like the flight-requirement-level case above.
        if (dayCommonCount > 0) this.issueObjection(d, 'ERROR', 12345, constraintMarker => `${constraintMarker} may be violated by ${d.marker}.`);
      });
    });
  }
}
