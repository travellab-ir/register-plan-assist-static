import React, { FC, Fragment } from 'react';
import { Theme, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails, Typography, Card, CardContent, Chip } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { ChevronDown as ExpandMoreIcon } from 'lucide-react';
import { WeekdayNames } from '@core/types/Weekday';
import Weekday from '@core/types/Weekday';
import FlightView from 'src/business/flight/FlightView';
import FlightRequirement from 'src/business/flight-requirement/FlightRequirement';
import Flight from 'src/business/flight/Flight';
import TargetObjectionStatus from 'src/components/preplan/TargetObjectionStatus';

const useStyles = makeStyles((theme: Theme) => ({
  dayHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingRight: theme.spacing(1)
  },
  dayHeaderCount: {
    color: theme.palette.text.secondary
  },
  details: {
    display: 'block',
    padding: theme.spacing(1)
  },
  flightCard: {
    marginBottom: theme.spacing(1),
    cursor: 'pointer'
  },
  flightCardTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  flightRoute: {
    display: 'flex',
    alignItems: 'baseline',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(0.5)
  },
  flightMetaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing(0.5)
  },
  emptyDay: {
    color: theme.palette.text.secondary,
    padding: theme.spacing(1)
  }
}));

export interface MobileTimelineAgendaProps {
  flightViews: readonly FlightView[];
  onEditFlightRequirement(flightRequirement: FlightRequirement): void;
  onEditFlight(flightRequirement: FlightRequirement, day: Weekday, flights?: readonly Flight[]): void;
}

// Renders the same week's flights as the desktop vis-timeline Gantt, but as a
// day-by-day agenda of cards instead of a horizontal chart — a Gantt with
// register-columns and minute-precision drag/resize has no sensible
// translation to a 360px-wide touch screen, so this is a different view
// rather than a squeezed one. Tapping a flight opens the same edit modal the
// Gantt would open on click; there is no drag-to-reschedule here, that stays
// a desktop-only interaction for now.
const MobileTimelineAgenda: FC<MobileTimelineAgendaProps> = ({ flightViews, onEditFlightRequirement, onEditFlight }) => {
  const classes = useStyles();

  const today = new Date().getWeekday();

  return (
    <div>
      {Weekday_ORDER.map(day => {
        const dayFlightViews = flightViews.filter(f => f.day === day).sort((a, b) => a.legs[0].std.minutes - b.legs[0].std.minutes);

        return (
          <ExpansionPanel key={day} defaultExpanded={day === today}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
              <div className={classes.dayHeader}>
                <Typography variant="subtitle1">{WeekdayNames[day]}</Typography>
                <Typography variant="body2" className={classes.dayHeaderCount}>
                  {dayFlightViews.length} flight{dayFlightViews.length === 1 ? '' : 's'}
                </Typography>
              </div>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails className={classes.details}>
              {dayFlightViews.length === 0 ? (
                <Typography className={classes.emptyDay} variant="body2">
                  No flights
                </Typography>
              ) : (
                dayFlightViews.map(flightView => {
                  const firstLeg = flightView.legs[0];
                  const lastLeg = flightView.legs[flightView.legs.length - 1];
                  return (
                    <Card
                      key={flightView.derivedId}
                      className={classes.flightCard}
                      onClick={() => onEditFlight(flightView.flightRequirement, flightView.day, flightView.flights)}
                    >
                      <CardContent>
                        <div className={classes.flightCardTopRow}>
                          <Typography variant="subtitle2">
                            {flightView.legs.map(leg => leg.flightNumber.toString()).join(' / ')}
                          </Typography>
                          <TargetObjectionStatus target={flightView.dayFlightRequirement} />
                        </div>
                        <div className={classes.flightRoute}>
                          <Typography variant="body1">{firstLeg.departureAirport.name}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {firstLeg.std.toString('HH:mm', true)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            →
                          </Typography>
                          <Typography variant="body1">{lastLeg.arrivalAirport.name}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {lastLeg.sta.toString('HH:mm', true)}
                          </Typography>
                        </div>
                        <div className={classes.flightMetaRow}>
                          <Chip size="small" label={flightView.aircraftRegister ? flightView.aircraftRegister.name : 'No Register'} />
                          <Chip size="small" variant="outlined" label={flightView.rsx} />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </ExpansionPanelDetails>
          </ExpansionPanel>
        );
      })}
    </div>
  );
};

export default MobileTimelineAgenda;

// Saturday-first order, matching the rest of the app (see Weekday enum).
const Weekday_ORDER: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];
