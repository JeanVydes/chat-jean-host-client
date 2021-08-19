import React from 'react';

export default class Loading extends React.Component<any, any> {
    public render() {
        return (
            <React.Fragment>
                <div className="loading-overlay-eQ unselectable">
                    <div className="loading-content-cUn">
                        <div id="circle-loading-zm-1" className="circle-loading-item-eWl circle-left-separator-qBk"></div>
                        <div id="circle-loading-zm-2" className="circle-loading-item-eWl circle-left-separator-qBk"></div>
                        <div id="circle-loading-zm-3" className="circle-loading-item-eWl circle-left-separator-qBk"></div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}