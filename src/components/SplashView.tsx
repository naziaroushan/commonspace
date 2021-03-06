import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import { withStyles, WithStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { observer } from 'mobx-react';

const styles = theme => ({
    backgroundContainer: {
        height: '100%',
        width: '100%',
        backgroundColor: '#008FEE',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    },
    root: {
        width: '100%',
        margin: 0,
        height: '100%',
        borderRadius: 0,
        [theme.breakpoints.up(700 + theme.spacing.unit * 3 * 2)]: {
            width: 700,
            height: 700,
            borderRadius: 700,
            marginLeft: 'auto',
            marginRight: 'auto'
        },
        display: 'flex',
        flex: '0 1 auto',
        alignItems: 'center',
        flexDirection: 'column',
        alignContent: 'center'
    },
    content: {
        padding: theme.spacing.unit * 3,
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        alignContent: 'center',
        justifyContent: 'center'
    },
    avatar: {
        marginBottom: theme.spacing.unit * 2
    },
    button: {
        margin: theme.spacing.unit * 3,
        boxShadow: 'none'
    },
    buttonLabel: {
        textTransform: 'none'
    },
    badges: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.unit * 2,
        marginBottom: theme.spacing.unit * 2
    },
    badge: {
        height: '40px',
        '& + &': {
            marginLeft: theme.spacing.unit * 2
        }
    }
});

// @ts-ignore
const SplashView = withStyles(styles)(
    observer((props: WithStyles) => {
        const { classes } = props;
        return (
            <div className={classes.backgroundContainer}>
                <Paper className={classes.root}>
                    <div className={classes.content}>
                        <Avatar
                            alt="Commons Icon"
                            src="/assets/images/AppIconSVG.svg"
                            className={classes.avatar}
                        />
                        <Typography variant="h4" align="center" gutterBottom>
                            CommonSpace
                        </Typography>
                        <Typography variant="h6" align="center">
                            Study the places you love
                        </Typography>
                        <div className={classes.badges}>
                            <a
                                className={classes.badge}
                                href="https://itunes.apple.com/us/app/commonspace/id1448384737?ls=1&mt=8"
                            >
                                <img
                                    height="40px"
                                    src="/assets/images/apple-badge.svg"
                                    alt="Download on the App Store"
                                />
                            </a>
                            <a
                                className={classes.badge}
                                href="https://play.google.com/store/apps/details?id=com.sidewalklabs.commonspace&hl=en"
                            >
                                <img
                                    height="40px"
                                    src="/assets/images/android-badge.png"
                                    alt="Download on the Play Store"
                                />
                            </a>
                        </div>
                        <Fab
                            variant="extended"
                            href="/about"
                            classes={{
                                root: classes.button,
                                label: classes.buttonLabel
                            }}
                        >
                            Learn More
                        </Fab>
                    </div>
                </Paper>
            </div>
        );
    })
);

export default SplashView;
