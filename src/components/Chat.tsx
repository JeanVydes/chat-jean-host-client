import React from 'react';
import Axios from 'axios';
import Loading from './Loading';
import { production, dev_url, prod_url, dev_client, prod_client } from '../config.json';

interface Props {
    match: any
    location: any
}

interface State {
    loading: boolean
    ws: any
    messageError: string
    messages: any[]
    messagesHTML: any[]
    notificationMessage: string
    userID: string
    guessName: boolean
    group: {
        id: string
        name: string
        owner: {
            id: string
            name: string
        }
		members: Member[]
    }
}

interface Member {
    id: string
    name: string
    messages_quantity: number
}

export default class Chat extends React.Component<Props, State> {
    public constructor(props: any) {
        super(props);

        this.state = {
            loading: true,
            ws: null,
            messageError: "",
            messages: [],
            messagesHTML: [],
            notificationMessage: "",
            userID: "",
            guessName: false,
            group: {
                id: "",
                name: "",
                owner: {
                    id: "",
                    name: ""
                },
                members: []
            }
        }
    }

    public async componentDidMount() {
        const url: string = `https:${(production ? prod_url : dev_url)}/api/status`;
        try {
            let checkStatus = await Axios({
                url,
                method: "GET"
            })
    
            if(checkStatus.status !== 200) return
        } catch {
            console.log("[API] The API is down!");
        }

        let query = new URLSearchParams(this.props.location.search)
        let setOwner = query.get("owner");
        let setOwnerID = query.get("ownerID");
        let name = query.get("name");
        let guessName = query.get("guessName");

        if (!this.props.match.params?.chatID) {
            return window.location.assign("/");
        }

        if((guessName && guessName === "true") && (!name || (name && name.length <= 0))) {
            return this.setState({
                guessName: true
            });
        }

        const wsURL: string = `wss:${(production ? prod_url : dev_url)}/api/group/${(this.props.match.params?.chatID || "")}?setOwner=${(setOwner || "false")}&setOwnerID=${(setOwnerID || "")}&name=${(name || "Cool Person!")}`;

        const ws = new WebSocket(wsURL)

        ws.onopen = async () => {
            console.log(`[WS] Successfully connected to ${wsURL}`);

            await this.setState({
                ws: ws
            });

            setInterval(() => {
                ws.send(JSON.stringify({
                    "ping": "pong"
                }));
            }, 5000);
        }

        ws.onerror = (err) => {
            console.log(`[WS] An error has been ocurred: \n${err.type}`);
        }

        ws.onclose = () => {
            console.log("[WS] Websocket connection has been closed, reconnecting page...");
            window.location.reload();
        }

        ws.onmessage = (packet: any) => {
            packet = JSON.parse(packet.data);
            
            if (!packet) return;
            if (!(packet.c || packet.d)) return;

            switch (packet.c) {
                case "auth_error":
                    ws.close()
                    window.location.assign("/");
                    break;
                case "receive_message":
                    this.newMessage(packet.d.message);
                    this.scroll();
                    break;
                case "set_message_error":
                    this.setMessageError(packet.d.message);
                    break;
                case "close_connection":
                    ws.close();
                    window.location.assign("/");
                    break;
                case "set_user_data":
                    packet.d.group.members = packet.d.group.members.sort((a: Member, b: Member) => (a.messages_quantity > b.messages_quantity) ? -1 : ((b.messages_quantity > a.messages_quantity) ? 1 : 0));

                    this.setState({
                        loading: false,
                        userID: packet.d.userID,
                        group: packet.d.group
                    });

                    document.title = `${packet.d.group.name}`;
                    break;
                default:
                    console.log(`[WS] Unknown packet:`);
                    console.log(packet);
            }
        }


       this.toggleGroupInfo();

       let notification: any = document.getElementsByClassName("chat-group-notification-message-uv")[0];
       if(notification) {
           notification.style.display = "none"
       }

        let input: any = document.getElementById("message-content-yyc");
        if (input) {
            input.addEventListener("keyup", ({ key }: any) => {
                if (key === "Enter") {
                    this.send();
                }
            })
        }
    }

    public send() {
        let input: any = document.getElementById("message-content-yyc");
        if (!input) return;

        this.state.ws.send(JSON.stringify({
            c: "send_message",
            d: {
                content: input.value
            }
        }));

        input.value = ""
    }

    public async newMessage(message: any) {
        let actualMessages = this.state.messages;
        actualMessages.push(message);

        let messagesHTML: any[] = this.state.messagesHTML;
        let childrenID: React.Key = ((Math.random() * 99999999) - 100000);

        if (message.author_id !== this.state.userID) {
            messagesHTML.push(
                <React.Fragment key={childrenID}>
                    <div className="chat-message-item-tc-other">
                        <div className="chat-message-item-tc-content-other">
                            <div className="chat-message-author-tc-other unselectable">
                                <p className="chat-message-author-text-tc-other">{message.author_name}</p>
                            </div>
                            <div className="chat-message-content-tc-other">
                                <p className="chat-message-content-text-tc-other">{message.content}</p>
                                <p className="chat-message-content-time-tc-me">{message.created_at.slice(11, 16)}</p>
                            </div>
                        </div>
                    </div>
                </React.Fragment>
            );
        } else {
            messagesHTML.push(
                <React.Fragment key={childrenID}>
                    <div className="chat-message-item-tc-me">
                        <div className="chat-message-item-tc-content-me">
                            <div className="chat-message-content-tc-me">
                                <p className="chat-message-content-text-tc-me">{message.content}</p>
                                <p className="chat-message-content-time-tc-me">{message.created_at.slice(11, 16)}</p>
                            </div>
                        </div>
                    </div>
                </React.Fragment>
            );
        }

        await this.setState({
            messages: actualMessages,
            messagesHTML,
            messageError: ""
        });
    }

    public setMessageError(message: any) {
        this.setState({
            messageError: message
        });
    }

    public getMessages() {
        return this.state.messagesHTML;
    }

    public copyInvite() {
        const el = document.createElement('textarea');
        el.value = `${production ? prod_client : dev_client}/group/${this.state.group.id}?name=&guessName=true`;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);

        window.alert("The invite link has been copied to your clipboard...");
        this.notification("The invite link has been copied to your clipboard...");
    }

    public toggleGroupInfo() {
        let popup: any = document.getElementsByClassName("chat-group-info-popup-eq")[0];
        if(!popup) return;

        if(popup.style.display === "none") {
            popup.style.display = "block"
        } else {
            popup.style.display = "none"
        }
    }

    public redirectWithoutName() {
        window.location.assign(`/group/${this.props.match.params?.chatID}?name=`)
    }

    public redirectWithName() {
        let input: any = document.getElementById("name-c-input");
        if(!input) return;

        window.location.assign(`/group/${this.props.match.params?.chatID}?name=${input.value}`);
    }

    public scroll() {
        var objDiv: any = document.getElementsByClassName("chat-messages-tc")[0];
        if(!objDiv) return
        objDiv.scrollTop = objDiv.scrollHeight;
    }

    public async notification(message: string) {
        this.setState({
            notificationMessage: message
        });

        let notification: any = document.getElementsByClassName("chat-group-notification-message-uv")[0];
        if(!notification) return;

        notification.style.display = "block"

        setTimeout(() => {
            notification.style.display = "none"
        }, 6000)
    }

    public render() {
        if(this.state.guessName) {
            return (
                <React.Fragment>
                    <div className="name-c">
                        <input id="name-c-input" className="name-c-input" placeholder="Your name for display to all members" autoFocus={true} maxLength={20}></input> 
                        <button className="name-c-go" onClick={() => this.redirectWithName()}>Go!</button>
                        <button className="name-c-without" onClick={() => this.redirectWithoutName()}>Continue without name</button>
                    </div>
                </React.Fragment>
            )
        } else if (!this.state.loading) {
            return (
                <React.Fragment>
                    <div className="chat-yv">
                        <div className="chat-content-yc">
                            <div className="chat-group-info-ul">
                                <div className="chat-group-title-xm vertically-align">
                                    <h1 className="chat-group-title-text-mv">{this.state.group.name || "Unknown Group Name"}</h1>
                                </div>
                                <div className="chat-group-options-vm vertically-align unselectable">
                                    <i className="fas fa-info-circle chat-group-option-right-spacing-yv" onClick={() => this.toggleGroupInfo()}></i>
                                    <i className="fas fa-user-plus chat-group-option-right-spacing-yv-2" onClick={() => this.copyInvite()}></i>
                                </div>
                            </div>

                            <div className="chat-messages-tc">
                                <div className="chat-announce-privacy-op unselectable">
                                    <p>This chat are secured end-to-end and just you and the members of this group can see the messages.</p>
                                </div>

                                <div className="chat-messages-tc-list">
                                    {this.state.messagesHTML.map(element => element)}
                                </div>
                            </div>

                            <div className="chat-control-rx unselectable">
                                <label htmlFor="message-content-yyc" className="message-error-al" id="message-error-al">{this.state.messageError}</label>
                                <textarea className="message-content-input-lop" id="message-content-yyc" name="message-content-yyc" placeholder="Type something..." autoFocus={true} maxLength={2000} />
                                <button className="message-send-button-xh" onClick={() => this.send()}><i className="fas fa-paper-plane"></i></button>
                            </div>
                        </div>
                    </div>
                    <div className="chat-group-info-popup-eq">
                        <p id="chat-group-info-popup-close-button-qe" onClick={() => this.toggleGroupInfo()}>X</p>
                        <div className="chat-group-info-popup-content-eq">
                            <h1 className="unselectable">{this.state.group.name}</h1>
                            <span className="chat-group-info-popup-ind-cx">Owner ID </span><p>{this.state.group.owner.id}</p>
                            <span className="chat-group-info-popup-ind-cx unselectable">Owner Name </span><p>{this.state.group.members.find((m) => m.id === this.state.group.owner.id)?.name}</p>
                            <span className="chat-group-info-popup-ind-cx unselectable">Members</span>
                            <div className="chat-group-info-popup-ind-cx-members unselectable">
                                {this.state.group.members.map((member: any) => {
                                    return (
                                        <React.Fragment>
                                            <span>{member.name}</span> 
                                            <p>has sent <span>{member.messages_quantity}</span> messages</p>
                                            <br/>
                                        </React.Fragment>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="chat-group-notification-message-uv">
                        <p>{this.state.notificationMessage}</p>
                    </div>
                </React.Fragment>
            )
        } else {
            return (
                <React.Fragment>
                    <Loading />
                </React.Fragment>
            )
        }
    }
}