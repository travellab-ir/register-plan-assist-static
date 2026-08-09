import Id from '@core/types/Id';
import DisruptionEventModel, { DisruptionEventReason } from '@core/models/preplan/DisruptionEventModel';
import PreplanAircraftRegister from 'src/business/preplan/PreplanAircraftRegister';
import { dataTypes } from 'src/utils/DataType';

/**
 * A time-boxed operational disruption affecting one aircraft register within a preplan.
 * Mirrors the construction style of PreplanAircraftRegister / FlightLeg.
 */
export default class DisruptionEvent {
  readonly id: Id;
  readonly aircraftRegister: PreplanAircraftRegister;
  readonly reason: DisruptionEventReason;
  readonly description: string;
  readonly startDateTime: Date;

  /** Undefined means the disruption is still open/ongoing (no known end yet). */
  readonly endDateTime?: Date;

  constructor(raw: DisruptionEventModel, aircraftRegisters: { readonly id: { readonly [id: string]: PreplanAircraftRegister } }) {
    this.id = raw.id;
    this.aircraftRegister = aircraftRegisters.id[raw.aircraftRegisterId];
    this.reason = raw.reason;
    this.description = raw.description;
    this.startDateTime = dataTypes.utcDate.convertModelToBusiness(raw.startDateTime);
    this.endDateTime = raw.endDateTime ? dataTypes.utcDate.convertModelToBusiness(raw.endDateTime) : undefined;
  }

  get marker(): string {
    return `disruption on ${this.aircraftRegister.name} (${this.reason})`;
  }

  /**
   * Whether this disruption's interval overlaps the given [start, end) interval.
   * An open-ended disruption (no endDateTime) is treated as covering everything after its start.
   */
  overlaps(start: Date, end: Date): boolean {
    const effectiveEnd = this.endDateTime ?? end;
    return this.startDateTime <= end && effectiveEnd >= start;
  }
}
