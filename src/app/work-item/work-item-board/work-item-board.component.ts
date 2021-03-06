import { Space } from 'ngx-fabric8-wit';
import { Subscription } from 'rxjs/Subscription';
import { cloneDeep } from 'lodash';
import { Component, OnInit } from '@angular/core';
import { Response } from '@angular/http';
import { Router } from '@angular/router';

import { AuthenticationService, Broadcaster } from 'ngx-login-client';
import { ArrayCount } from 'ngx-widgets';

import { WorkItem } from '../../models/work-item';
import { WorkItemService } from '../work-item.service';


@Component({
  host: {
     'class': 'app-component flex-container in-column-direction flex-grow-1'
  },
  selector: 'alm-board',
  templateUrl: './work-item-board.component.html',
  styleUrls: ['./work-item-board.component.scss']
})

export class WorkItemBoardComponent implements OnInit {
  workItems: WorkItem[] = [];
  lanes: Array<any> = [];
  loggedIn: Boolean = false;
  spaceSubscription: Subscription;

  constructor(
    private auth: AuthenticationService,
    private broadcaster: Broadcaster,
    private router: Router,
    private workItemService: WorkItemService) {}

  ngOnInit() {
    this.loggedIn = this.auth.isLoggedIn();
    this.getSTates();
    this.spaceSubscription = this.broadcaster.on<Space>('spaceChanged').subscribe(space => {
      if (space) {
        console.log('[WorkItemBoardComponent] New Space selected: ' + space.attributes.name);
        this.getSTates();
      } else {
        console.log('[WorkItemBoardComponent] Space deselected');
        this.workItems = [];
        this.lanes = [];
        this.workItemService.resetWorkItemList();
      }
    });
  }

  getWorkItems() {
    this.workItemService.getWorkItems()
      .then(workItems => {
        this.workItems = workItems;
        // console.log(this.workItems);
        // need push lane data here once the backend data is available
        /*this.lanes.push({title: 'Backlog', cards: workItems});
        this.lanes.push({title: 'In-Progress', cards: [{'id': 211, fields: {'system.title': 'Item A'}}, {'id': 212, fields: {'system.title': 'Item B'}}, {'id': 213, fields: {'system.title': 'Item C'}}, {'id': 214, fields: {'system.title': 'Item D'}}]});
        this.lanes.push({title: 'Done', cards: [{'id': 311, fields: {'system.title': 'Item 1'}}, {'id': 312, fields: {'system.title': 'Item 2'}}, {'id': 313, fields: {'system.title': 'Item 3'}}, {'id': 314, fields: {'system.title': 'Item 4'}}]});*/
     });
  }

  getSTates() {
    this.workItemService.getStatusOptions()
      .then((response) => {
        this.lanes = response;
        this.getWorkItems();
      });
  }

  gotoDetail(workItem: WorkItem) {
    let link = [ this.router.url.split('detail')[0] + '/detail/' + workItem.id ];
    this.router.navigate(link);
  }
}
