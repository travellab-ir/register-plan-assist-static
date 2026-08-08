import React, { FC } from 'react';
import Dialog, { DialogProps } from '@material-ui/core/Dialog';
import Paper, { PaperProps } from '@material-ui/core/Paper';
import { createStyles, withStyles } from '@material-ui/styles';
import Draggable from 'react-draggable';
import { useIsCompact } from 'src/utils/useResponsive';

const styles = createStyles({
  root: {
    overflow: 'visible'
  }
});

const DraggablePaper = withStyles(styles)((props: PaperProps) => (
  <Draggable cancel={'[class*="MuiDialogContent-root"]'}>
    <Paper {...props} />
  </Draggable>
));

// On touch/mobile, dragging the dialog by its title bar fights with
// scrolling and with the platform's own full-screen dialog convention, so
// every dialog in the app (all of them go through this one component)
// drops the drag behavior and goes full-screen below the "sm" breakpoint
// instead of floating as a small draggable window.
export interface DraggableDialogProps extends DialogProps {}

const DraggableDialog: FC<DraggableDialogProps> = props => {
  const isCompact = useIsCompact();

  if (isCompact) {
    return <Dialog fullScreen {...props} PaperComponent={Paper} />;
  }

  return <Dialog {...props} PaperComponent={DraggablePaper} />;
};

export default DraggableDialog;
