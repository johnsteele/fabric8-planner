import { Component, OnInit, AfterViewInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { cloneDeep } from 'lodash';
import { Broadcaster, AuthenticationService } from 'ngx-login-client';
import { Subscription } from 'rxjs/Subscription';
import { Space } from 'ngx-fabric8-wit';

import { WorkItemService } from './../work-item/work-item.service';
import { WorkItemListEntryComponent } from './../work-item/work-item-list/work-item-list-entry/work-item-list-entry.component';
import { WorkItemType } from './../models/work-item-type';
import { WorkItem } from './../models/work-item';

import {
  AlmArrayFilter,
  FilterConfig,
  FilterEvent,
  FilterField,
  ToolbarConfig
} from 'ngx-widgets';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'toolbar-panel',
  templateUrl: './toolbar-panel.component.html',
  styleUrls: ['./toolbar-panel.component.scss']
})
export class ToolbarPanelComponent implements OnInit, AfterViewInit {
  @ViewChild('actions') actionsTemplate: TemplateRef<any>;
  @ViewChild('add') addTemplate: TemplateRef<any>;

  filters: any[] = [];
  loggedIn: boolean = false;
  editEnabled: boolean = false;
  authUser: any = null;
  workItemTypes: WorkItemType[];
  workItemToMove: WorkItemListEntryComponent;
  workItemDetail: WorkItem;
  showTypesOptions: boolean = false;
  spaceSubscription: Subscription = null;

  filterConfig: FilterConfig;
  toolbarConfig: ToolbarConfig;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private broadcaster: Broadcaster,
    private workItemService: WorkItemService,
    private auth: AuthenticationService) {
  }

  ngOnInit() {
    this.loggedIn = this.auth.isLoggedIn();
    this.listenToEvents();
    this.spaceSubscription = this.broadcaster.on<Space>('spaceChanged').subscribe(space => {
      if (space) {
        console.log('[FilterPanelComponent] New Space selected: ' + space.attributes.name);
        this.editEnabled = true;
        this.getWorkItemTypes();
      } else {
        console.log('[FilterPanelComponent] Space deselected.');
        this.editEnabled = false;
        this.workItemTypes = [];
      }
    });

    this.filterConfig = {
      fields: [{
        id: 'user',
        title:  'User',
        placeholder: 'Filter by Assignee...',
        type: 'select',
        queries: [{
          id:  '1',
          value: 'Assigned to Me'
        }]
      }] as FilterField[],
      appliedFilters: [],
      resultsCount: -1, // Hide
      selectedCount: 0,
      totalCount: 0,
      tooltipPlacement: "right"
    } as FilterConfig;

    this.toolbarConfig = {
      actionConfig: {},
      filterConfig: this.filterConfig
    } as ToolbarConfig;
  }

  ngAfterViewInit(): void {
    this.authUser = cloneDeep(this.route.snapshot.data['authuser']);
    this.setFilterValues();
  }

  filterChange($event: FilterEvent): void {
    let activeFilters = 0;
    this.filters.forEach((f: any) => {
      f.active = false;
    });
    $event.appliedFilters.forEach((filter) => {
      let selectedIndex = this.filters.findIndex((f: any) => {
        return f.id === filter.query.id;
      });
      if (selectedIndex > -1) {
        this.filters[selectedIndex].active = true;
      }
    });
    this.broadcaster.broadcast('item_filter', this.filters);
  }

  setFilterValues() {
    if (this.loggedIn) {
      this.filters.push({
        id:  "1",
        name: 'Assigned to Me',
        paramKey: 'filter[assignee]',
        active: false,
        value: this.authUser.id
      });
    } else {
      let index = this.filters.findIndex(item => item.id === 1);
      this.filters.splice(index, 1);
    }
  }

  moveItem(moveto: string) {
    this.broadcaster.broadcast('move_item', moveto);
  };

  //Detailed add functions
  getWorkItemTypes(){
    this.workItemService.getWorkItemTypes()
      .then((types) => {
        this.workItemTypes = types;
      });
  }
  showTypes() {
    this.showTypesOptions = true;
  }
  closePanel() {
    this.showTypesOptions = false;
  }
  onChangeType(type: string) {
    this.showTypesOptions = false;
    this.router.navigate(['/work-item/list/detail/new?' + type]);
  }

  // event handlers
  onToggle(entryComponent: WorkItemListEntryComponent): void {
    // This condition is to select a single work item for movement
    // deselect the previous checked work item
    if (this.workItemToMove) {
      this.workItemToMove.uncheck();
    }
    if (this.workItemToMove == entryComponent) {
      this.workItemToMove = null;
    } else {
      entryComponent.check();
      this.workItemToMove = entryComponent;
    }
  }

  listenToEvents() {
    this.broadcaster.on<string>('logout')
      .subscribe(message => {
        this.loggedIn = false;
        this.authUser = null;
        this.setFilterValues();
    });
  }
}
