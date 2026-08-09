import Checker from 'src/business/constraints/Checker';
import Preplan from 'src/business/preplan/Preplan';
import ConstraintSystem from 'src/business/constraints/ConstraintSystem';
import { ConstraintTemplate } from 'src/business/master-data';

export default class FlightRequirementRestrictionOnFlightsChecker extends Checker {
  constructor(preplan: Preplan, constraintSystem: ConstraintSystem, constraintTemplate: ConstraintTemplate) {
    super(preplan, constraintSystem, constraintTemplate);
  }

  check(): void {
    //TODO: The original logic also rejected a flight that is 'required' but has no included (non-backup) aircraft
    //register assigned. The `required`/`scope.required` concept no longer exists anywhere in the current data
    //model (FlightRequirement, DayFlightRequirement, or their scopes), so that rule has been dropped here rather
    //than guessed at (e.g. approximating it with `rsx === 'REAL'` would be a business-logic assumption, not a
    //restoration). Needs a product decision: drop for good, or reintroduce an explicit `required` flag.
    this.preplan.flightLegs.forEach(f => {
      const aircraftRegisterFit = !f.aircraftRegister || f.dayFlightRequirement.aircraftSelection.aircraftRegisters.includes(f.aircraftRegister);
      if (!aircraftRegisterFit) {
        this.issueObjection(f, 'ERROR', 12345, constraintMarker => `${constraintMarker}: ${f.marker} is not allowed to go with this aircraft register.`);
        return;
      }
      const stdFit = f.actualStd >= f.dayFlightRequirementLeg.actualStdLowerBound && f.actualStd <= f.dayFlightRequirementLeg.actualStdUpperBound;
      if (!stdFit) this.issueObjection(f, 'ERROR', 12345, constraintMarker => `${constraintMarker}: ${f.marker} STD is out of its predefined limits.`);
    });
  }
}
