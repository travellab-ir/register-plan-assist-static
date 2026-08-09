import Id from '@core/types/Id';
import Validation from '@ahs502/validation';
import MasterDataCollection from '@core/types/MasterDataCollection';
import AircraftRegisterModel from '@core/models/master-data/AircraftRegisterModel';

/**
 * The reason an aircraft register becomes temporarily unavailable during a preplan.
 * AOG            : Aircraft on ground (technical/mechanical fault).
 * AIRPORT_CLOSED : The aircraft's base or a required airport is closed (weather, NOTAM, etc.).
 * OTHER          : Any other operational reason (crew shortage, customs hold, etc.).
 */
export const DisruptionEventReasons = <const>['AOG', 'AIRPORT_CLOSED', 'OTHER'];
export type DisruptionEventReason = typeof DisruptionEventReasons[number];

/**
 * Describes a single, time-boxed operational disruption affecting one aircraft register
 * within a preplan. While active, the register is treated as unavailable for any flight leg
 * that overlaps the given interval.
 */
export default interface DisruptionEventModel {
  readonly id: Id;

  /** The aircraft register (real or dummy) that is unavailable. */
  readonly aircraftRegisterId: Id;

  readonly reason: DisruptionEventReason;

  /** Free-text explanation, e.g. "Engine inspection, EK-INFO-2026-118". */
  readonly description: string;

  /** ISO datetime, inclusive. */
  readonly startDateTime: string;

  /** ISO datetime, inclusive. If omitted, the disruption is open-ended (still ongoing). */
  readonly endDateTime?: string;
}

export class DisruptionEventModelValidation extends Validation {
  constructor(data: DisruptionEventModel, aircraftRegisters: MasterDataCollection<AircraftRegisterModel>, dummyAircraftRegisterIds: readonly Id[]) {
    super(validator =>
      validator.object(data).then(({ aircraftRegisterId, reason, description, startDateTime, endDateTime }) => {
        validator
          .must(typeof aircraftRegisterId === 'string', !!aircraftRegisterId)
          .must(() => aircraftRegisterId in aircraftRegisters.id || dummyAircraftRegisterIds.includes(aircraftRegisterId));
        validator.must(DisruptionEventReasons.includes(reason));
        validator.must(typeof description === 'string');
        validator
          .must(typeof startDateTime === 'string', !!startDateTime)
          .must(() => new Date(startDateTime).isValid());
        validator
          .if(endDateTime !== undefined)
          .must(() => new Date(endDateTime!).isValid())
          .must(() => new Date(endDateTime!) >= new Date(startDateTime));
      })
    );
  }
}
