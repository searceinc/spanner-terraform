import { Component, OnInit } from '@angular/core';
import { Chart, StockChart } from 'angular-highcharts';
import { ActivatedRoute } from '@angular/router';
import { RestService } from '../../services/rest.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { interval, Subscription } from "rxjs";
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-stock-dashboard',
  templateUrl: './stock-dashboard.component.html',
  styleUrls: ['./stock-dashboard.component.css']
})
export class StockDashboardComponent implements OnInit {

  selectedCompany: string = "";
  lastUpdatedTime;
  stock: StockChart;
  stocks: any;
  company: any;
  companies: any;
  loader: boolean = false;
  subscription: Subscription;
  intervalId: number;
  sId: String;

  constructor(private router: ActivatedRoute, private _snackBar: MatSnackBar, private restService: RestService) {
  }

  ngOnInit(): void {
    this.sId = this.router.snapshot.queryParamMap.get('sId');
    this.getCompanies();
  }

  getCompanies() {
    this.restService.getData('companies/list')
      .pipe(take(1))
      .subscribe(
        response => {
          if (response && response.success) {
            this.companies = response.data;
            if (this.companies && this.companies.length > 0) {
              if(this.sId){
                this.selectedCompany = this.router.snapshot.queryParamMap.get('companyId');
              }else{
                this.selectedCompany = this.companies[0].companyId;
              }
              this.getStockData();
            }
          }
        },
        error => {
          this.openSnackBar(error.error.message, "")
          this.loader = false;
        });
  }

  getStockData() {
    if (this.selectedCompany) {
      let params = `${this.selectedCompany}`;
      if(this.sId){
        params += `?sId=${this.sId}` ;
      }
      console.log(params);
      this.loader = true;
      this.restService.getData(`companies/dashboard/${params}`)
        .subscribe(
          response => {
            if (response && response.success) {
              this.stocks = response.data.stocks;
              this.company = response.data.company;
              if (this.stocks && this.stocks.length > 0) {
                this.parseStockDatas();
                this.lastUpdatedTime = this.stocks[(this.stocks.length - 1)].date;
              }else if(this.company && this.company.status === 'PROCESSING'){
                setTimeout(() => {
                  this.getStockData();
              }, 5000);
              }
              this.loader = false;
            }
          },
          error => {
            this.openSnackBar(error.error.message, "")
            this.loader = false;
          });
    }
  }

  parseStockDatas() {
    const data = [];
    for (var i = 0; i < this.stocks.length; i++) {
      data.push([this.stocks[i].date, parseInt(this.stocks[i].currentValue)])
    }
    this.createChart(data)
  }

  createChart(data) {
    this.stock = new StockChart({
      rangeSelector: {
        selected: 1
      },
      title: {
        text: this.company.companyName + ' Stock Price'
      },
      series: [{
        tooltip: {
          valueDecimals: 2,
        },
        name: this.company.companyShortCode,
        type: 'line',
        data: data,
      }]
    });
    if (this.sId) {
      this.updatePoints();
    }
  }

  updatePoints() {
    const source = interval(5000);
    this.subscription = source.subscribe(val => this.updateDashboard());
  }

  updateDashboard() {
    if (this.selectedCompany && this.stocks.length && this.lastUpdatedTime) {
      this.restService.getData(`companies/dashboard/${this.selectedCompany}?sId=${this.sId}&date=${this.lastUpdatedTime}`)
        .subscribe(
          response => {
            if (response && response.success) {
              const data = response.data.stocks;
              const company = response.data.company;
              if (company.status == 'COMPLETED' && this.subscription) {
                this.subscription && this.subscription.unsubscribe();
              } else {
                this.stocks = data;
                if (data && data.length > 0) {
                  this.lastUpdatedTime = this.stocks[(this.stocks.length - 1)].date;
                  this.stock.ref$.subscribe(chart => {
                    for (var i = 0; i < data.length; i++) {
                      chart.series[0].addPoint([data[i].date, parseInt(data[i].currentValue)]);
                    }
                  });
                }
              }
            }
          },
          error => {
            this.openSnackBar(error.error.message, "")
            this.loader = false;
          });
    }
  }


  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }

  changeCompany() {
    this.getStockData()
  }







  ngOnDestroy() {
    this.subscription && this.subscription.unsubscribe();
  }
}







