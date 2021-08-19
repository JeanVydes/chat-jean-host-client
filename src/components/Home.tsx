import React from 'react';
import Axios from 'axios';
import { production, dev_url, prod_url } from '../config.json';


interface Props {}
interface State {}

export default class Home extends React.Component<Props, State> {
    public async componentDidMount() {
        const statusUrl: string = `https:${(production ? prod_url : dev_url)}/api/status`;
        try {
            let checkStatus = await Axios({
                url: statusUrl,
                method: "GET"
            })
    
            if(checkStatus.status !== 200) return
        } catch {
            console.log("[API] The API is down!");
        }
    }

    public async CreateGroup() {
        let groupNameInput: any = document.getElementById("home-input-group-name-uc");
        if(!groupNameInput) return;

        let nameInput: any = document.getElementById("home-input-name-ak");
        if(!nameInput) return;

        const url: string = `https:${(production ? prod_url : dev_url)}/api/create/group?groupName=${groupNameInput.value || ""}`;

        let r = await Axios({
            url,
            method: "POST",
        });

        return window.location.assign(`/group/${r.data?.data?.group?.id || "none"}?owner=true&ownerID=${r.data?.data?.group?.owner?.id || "none"}&name=${nameInput.value || ""}`);
    }

    public render() {
        return (
            <React.Fragment>
                <div className="home-io unselectable">
                    <input id="home-input-group-name-uc" className="home-input-x" name="groupName" type="text" placeholder="Group name..." maxLength={30}></input>
                    <input id="home-input-name-ak" className="home-input-x" name="name" type="text" placeholder="Your name..." maxLength={20}></input>
                    <button className="home-button-create-group-mx" onClick={() => this.CreateGroup()}>Create Group</button>
                </div>
            </React.Fragment>
        )
    }
}