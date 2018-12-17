import React, { Fragment } from 'react';
import classNames from 'classnames';
import { withStyles, WithStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Avatar from '@material-ui/core/Avatar';
import Icon from '@material-ui/core/Icon';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Modal from '@material-ui/core/Modal';

import { observer } from 'mobx-react';

import StudiesList from './StudiesList';
import StudyView from './StudyView';
import SurveyorsView from './SurveyorsView';
import uiState, { visualizeNewStudy, AuthMode, AvailableModals } from '../stores/ui';
import applicationState, { setCurrentStudyEmptySkeleton, ApplicationState, studyEmptySkeleton } from '../stores/applicationState';

const drawerWidth = 240;

interface MainProps {
    isOpen: boolean;
    applicationState: ApplicationState;
}

const styles = theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column'
    },
    toolbar: {
        color: 'inherit'
    },
    toolbarIcon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 8px',
        ...theme.mixins.toolbar
    },
    modal: {
        top: 300,
        left: 300
    },
    paper: {
        position: 'absolute',
        width: theme.spacing.unit * 50,
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[5],
        padding: theme.spacing.unit * 4,
        width: "50%",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)"
    },
    appBar: {
        position: 'relative',
        display: 'flex',
        marginTop: 'auto'
    },
    icon: {
        marginRight: theme.spacing.unit * 2,
    },
    title: {
        marginLeft: theme.spacing.unit * 2,
        flexGrow: 1
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing.unit * 3,
        height: '100vh',
        overflow: 'auto'
    }
});

// @ts-ignore
const WrapInModal = observer(withStyles(styles)(props => {
    const { classes, children, modalType, visibleModal, onClose = () => uiState.visibleModal = null } = props;
    return (
        <Modal
            open={visibleModal === modalType}
            onClose={onClose}
        >
            <div className={classes.paper}>
                {children}
            </div>
        </Modal>
    )
}));

function prepareNewStudy() {
    setCurrentStudyEmptySkeleton()
    visualizeNewStudy()
}

const Main = observer(
    (props: MainProps & WithStyles) => {
        const { applicationState, classes } = props;
        const { studies, token } = applicationState;
        const { visibleModal } = uiState;
        const currentStudy = applicationState.currentStudy ? applicationState.currentStudy : studyEmptySkeleton();
        let { studyId, surveyors } = currentStudy;
        return (
            <div className={classes.root}>
                <CssBaseline />
                <AppBar
                    className={classes.appBar}
                    color="default"
                >
                    <Toolbar className={classes.toolbar}>
                        <Avatar alt="Commons Icon" src="/assests/images/CircleIcon.png" className={classes.avatar} />
                        <Typography
                            component="h1"
                            variant="title"
                            color="inherit"
                            noWrap
                            className={classes.title}
                        >
                            Commons
                        </Typography>
                        <IconButton
                            color="inherit"
                            aria-label="Open Menu"
                            onClick={() => console.log('open menu')}
                            className={classes.menuIcon}
                        >
                            <MoreVertIcon />
                        </IconButton>
                    </Toolbar>
                </AppBar>
                <div>
                    <Typography
                        component="h1"
                        variant="title"
                        color="inherit"
                        noWrap
                        className={classes.title}
                    >
                        All Studies
                    </Typography>
                    <Button color="primary" variant="contained" onClick={prepareNewStudy}>
                        New study
                    </Button>
                    <Paper>
                        <List>
                            <StudiesList studies={studies} />
                        </List>
                    </Paper>
                    <WrapInModal modalType={'study'} visibleModal={visibleModal}>
                        <StudyView study={currentStudy} studyIsNew={uiState.currentStudyIsNew} />
                    </WrapInModal>
                    <WrapInModal onClose={() => uiState.visibleModal = 'study'} modalType={'surveyors'} visibleModal={visibleModal}>
                        <SurveyorsView studyId={currentStudy.studyId} surveyors={currentStudy.surveyors} />
                    </WrapInModal>
                </div>

            </div >
        )
    }
);

// @ts-ignore
export default withStyles(styles)(Main);
