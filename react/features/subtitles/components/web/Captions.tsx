import { Theme } from '@mui/material';
import React, { ReactElement } from 'react';
import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { getLocalParticipant } from '../../../base/participants/functions';
import { getLargeVideoParticipant } from '../../../large-video/functions';
import { getTransitionParamsForElementsAboveToolbox, isToolboxVisible } from '../../../toolbox/functions.web';
import { isLayoutTileView } from '../../../video-layout/functions.web';
import { calculateSubtitlesFontSize } from '../../functions.web';
import {
    AbstractCaptions,
    type IAbstractCaptionsProps,
    _abstractMapStateToProps
} from '../AbstractCaptions';

interface IProps extends IAbstractCaptionsProps {

    /**
     * The height of the visible area.
     */
    _clientHeight?: number;

    /**
     * Whether the subtitles container is lifted above the invite box.
     */
    _isLifted: boolean | undefined;

    /**
     * Whether the toolbox is visible or not.
     */
    _toolboxVisible: boolean;

    /**
     * An object containing the CSS classes.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;
}


const styles = (_theme: Theme, props: IProps) => {
    const { _isLifted = false, _clientHeight, _toolboxVisible = false } = props;

    const toolbarSize = 48;
    const fontSize = calculateSubtitlesFontSize(_clientHeight);
    let bottom = 40;
    const padding = Math.ceil(0.2 * fontSize);

    // This is the case where we display the onstage participant display name
    // below the subtitles.
    if (_isLifted) {
        bottom += 36 + padding; // 36px is the height
    }

    if (_toolboxVisible) {
        bottom += toolbarSize;
    }

    return {
        transcriptionSubtitles: {
            bottom: `${bottom}px`,
            fontSize: `${fontSize}px`,
            left: '50%',
            maxWidth: '50vw',
            overflowWrap: 'break-word' as const,
            pointerEvents: 'none' as const,
            position: 'absolute' as const,
            textShadow: `
                0px 0px 1px rgba(0,0,0,0.3),
                0px 1px 1px rgba(0,0,0,0.3),
                1px 0px 1px rgba(0,0,0,0.3),
                0px 0px 1px rgba(0,0,0,0.3)`,
            transform: 'translateX(-50%)',
            zIndex: 7,
            lineHeight: 1.2,
            transition: `bottom ${getTransitionParamsForElementsAboveToolbox(_toolboxVisible)}`,

            span: {
                color: '#fff',
                background: 'black',

                // without this when the text is wrapped on 2+ lines there will be a gap in the background:
                padding: `${Math.ceil(0.2 * fontSize)}px 0px`
            }
        }
    };
};

/**
 * React {@code Component} which can display speech-to-text results from
 * Jigasi as subtitles.
 */
class Captions extends AbstractCaptions<IProps> {

    /**
     * Renders the transcription text.
     *
     * @param {string} id - The ID of the transcript message from which the
     * {@code text} has been created.
     * @param {string} text - Subtitles text formatted with the participant's
     * name.
     * @protected
     * @returns {ReactElement} - The React element which displays the text.
     */
    _renderParagraph(id: string, text: string): ReactElement {
        return (
            <p key = { id }>
                <span>{ text }</span>
            </p>
        );
    }

    /**
     * Renders the subtitles container.
     *
     * @param {Array<ReactElement>} paragraphs - An array of elements created
     * for each subtitle using the {@link _renderParagraph} method.
     * @protected
     * @returns {ReactElement} - The subtitles container.
     */
    _renderSubtitlesContainer(paragraphs: Array<ReactElement>): ReactElement {
        const classes = withStyles.getClasses(this.props);

        return (
            <div className = { classes.transcriptionSubtitles } >
                { paragraphs }
            </div>
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated {@code }'s
 * props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState) {
    const isTileView = isLayoutTileView(state);
    const largeVideoParticipant = getLargeVideoParticipant(state);
    const localParticipant = getLocalParticipant(state);
    const { clientHeight } = state['features/base/responsive-ui'];

    return {
        ..._abstractMapStateToProps(state),
        _isLifted: Boolean(largeVideoParticipant && largeVideoParticipant?.id !== localParticipant?.id && !isTileView),
        _clientHeight: clientHeight,
        _toolboxVisible: isToolboxVisible(state)
    };
}

export default connect(mapStateToProps)(withStyles(Captions, styles));
