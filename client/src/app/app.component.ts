import {Component, OnInit} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../environments/environment';
import {AppService} from "./app.service";
import {Router, ActivationStart} from "@angular/router";
import {Location} from "@angular/common";
import {HostListener} from "@angular/core";
import {JournalsService} from "./journals/journals.service";
import {MatSnackBar} from "@angular/material";


declare var gapi: any;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    providers: [AppService, JournalsService]
})
export class AppComponent implements OnInit {
    googleAuth;
    public currentPath;
    public currentWidth;
    public currentId;
    public username: string;

    constructor(private http: HttpClient,
                public appService: AppService,
                private router: Router,
                private _location: Location,
                public journalListService: JournalsService,
                public snackBar: MatSnackBar) {

        this.router.events.subscribe((e) => {
            if (e instanceof ActivationStart) {
                this.currentPath = e.snapshot.routeConfig.path;
                this.currentId = e.snapshot.params['_id'];
            }
        })

        this.onResize();
    }

    deleteJournal(_id: string) {
        this.journalListService.deleteJournal(_id).subscribe(
            journals => {
                console.log("first part");
                //this.refreshJournal();
                //this.loadService();
            },
            err => {
                console.log(err);
                console.log("hi");
                //this.refreshJournal();
                //this.loadService();
                this.snackBar.open("Deleted Journal", "CLOSE", {
                    duration: 2000,
                });
            }
        );
    }

    @HostListener('window:resize', ['$event'])
    onResize(event?) {
        this.currentWidth = window.innerWidth;
    }

    backClicked() {
        this._location.back();

    }

    isJournalView(): boolean {
        if (this.currentPath == 'journals/:_id' && this.currentWidth < 600) {
            return true;
        } else {
            return false;
        }


    }

    getUsername () {
        this.username = localStorage.getItem("userFirstName") + " " + localStorage.getItem("userLastName");
        if (this.username.length > 18) {
            this.username = this.username.slice(0, 17) + "...";
        }
    }

    signIn() {
        //let googleAuth = gapi.auth2.getAuthInstance();
        this.googleAuth = gapi.auth2.getAuthInstance();
        console.log(this.googleAuth);
        this.googleAuth.grantOfflineAccess().then((resp) => {
            localStorage.setItem('isSignedIn', 'true');
            this.sendAuthCode(resp.code);
        });
    }

    signOut() {
        //let googleAuth = gapi.auth2.getAuthInstance();
        this.handleClientLoad();

        this.googleAuth = gapi.auth2.getAuthInstance();

        this.googleAuth.then(() => {
            this.googleAuth.signOut();
            localStorage.setItem('isSignedIn', 'false');
            localStorage.setItem("userID", "");
            window.location.reload();
        })
    }

    sendAuthCode(code: string): void {
        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            }),
        };

        this.http.post(environment.API_URL + "login", {code: code}, httpOptions)
            .subscribe(onSuccess => {
                console.log("Code sent to server");
                console.log(onSuccess["_id"]["$oid"]);
                console.log(onSuccess["FirstName"]);
                console.log(onSuccess["LastName"]);
                localStorage.setItem("userID", onSuccess["_id"]["$oid"]);
                localStorage.setItem("userFirstName", onSuccess["FirstName"]);
                localStorage.setItem("userLastName", onSuccess["LastName"]);
            }, onFail => {
                console.log("ERROR: Code couldn't be sent to the server");
            });
    }

    handleClientLoad() {
        gapi.load('client:auth2', this.initClient);
    }

    initClient() {
        gapi.client.init({
            'clientId': '1080043572259-h3vk6jgc4skl3uav3g0l13qvlcqpebvu.apps.googleusercontent.com',
            'scope': 'profile email'
        });
    }

    ngOnInit() {
        this.handleClientLoad();
        gapi.load('client:auth2', this.initClient);
        this.getUsername();
    }
}
