import { Component, ElementRef, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RcuService } from '../../services/rcu.service';
import { Rcu } from '../../model/rcu';
import { Event } from '../../model/event';
import { Anomaly } from '../../model/anomaly';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-event',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ereignisse.component.html'
})
export class EventComponent implements OnInit {

  anomalies: Anomaly[] = [];
  events: Event[] = [];
  // Status
  loading = false;

  constructor(
    private el: ElementRef,
    private rcuService: RcuService,
    private router: Router
  ) {
    this.loadData();
  }

  // Graph automatisch aktualisieren
  ngOnInit() {
    setInterval(() => {
      this.loadData();
    }, 3000);
  }

  loadData(): void {
    this.loading = true;

    this.rcuService.getAllAnomalies().subscribe({
      next: (data: Anomaly[]) => {
        this.anomalies = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
      }
    });

    this.rcuService.getGraphEvents().subscribe({
      next: (data: Event[]) => {
        this.events = data;
        this.renderTree(data);
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
      }
    });

  }

  deleteAnomaly(id: number): void {
    Swal.fire({
      text: `Möchten Sie wirklich diese Meldung löschen?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ja',
      cancelButtonText: 'Nein',
      color: '#002B49',
      buttonsStyling: false,
      customClass: {
        actions: 'space-x-4 justify-center',
        confirmButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition',
        cancelButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
      }
    }).then(result => {
      if (result.isConfirmed) {
        this.rcuService.deleteAnomaly(id).subscribe({
          next: () => this.loadData()
        });
      }
    });
  }

  deleteAllAnomalies(): void {
    Swal.fire({
      text: `Möchten Sie wirklich alle Meldungen löschen?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ja',
      cancelButtonText: 'Nein',
      color: '#002B49',
      buttonsStyling: false,
      customClass: {
        actions: 'space-x-4 justify-center',
        confirmButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition',
        cancelButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
      }
    }).then(result => {
      if (result.isConfirmed) {
        this.rcuService.deleteAllAnomalies().subscribe({
          next: () => this.loadData()
        });
      }
    });
  }

  renderTree(events: Event[]) {

    const element = this.el.nativeElement.querySelector('svg.event-graph');
    const svg = d3.select(element);
    svg.selectAll("*").remove();

    const WIDTH = 800;
    const HEIGHT = 800;
    const spacing = 80;

    svg
      .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`)
      .attr("width", "100%")
      .attr("height", "100%");

    const g = svg.append("g");

    // 1) Events vertikal angeordnet (oben → neu)
    const positioned = events.map((e, i) => ({
      ...e,
      y: 50 + i * spacing,            // NEU → graph beginnt oben
      x: this.xByResult(e.result)     // links / center / rechts
    }));

    // 2) Graph-Höhe berechnen
    const totalHeight = positioned.length * spacing;

    // 3) Graph vertikal in der Mitte des SVG platzieren
    const offsetY = 0;
    const offsetX = (WIDTH - 800) / 2 - 20; // optional

    g.attr("transform", `translate(${offsetX}, ${offsetY})`);

    // 3 Ebenen für perfekte Z-Order
    const layerLines = g.append("g").attr("class", "layer-lines");
    const layerNodes = g.append("g").attr("class", "layer-nodes");
    const layerLabels = g.append("g").attr("class", "layer-labels");

    //
    // 4) LINES (unterste Ebene)
    //
    layerLines.selectAll("line")
      .data(positioned.slice(1))
      .enter()
      .append("line")
      .attr("x1", (d, i) => positioned[i].x)
      .attr("y1", (d, i) => positioned[i].y)
      .attr("x2", (d) => d.x)
      .attr("y2", (d) => d.y)
      .attr("stroke", "#aaa")
      .attr("stroke-width", 1.5);

    //
    // 5) NODES (Mitte-Ebene)
    //
    layerNodes.selectAll("circle")
      .data(positioned)
      .enter()
      .append("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 8)
      .attr("fill", "#fff")
      .attr("stroke", (d) => this.colorByResult(d.result))
      .attr("stroke-width", 2);

    //
    // 6) LABELS (oberste Ebene)
    //
    // Haupttitel
    const labelMain = layerLabels.selectAll("text.label-main")
      .data(positioned)
      .enter()
      .append("text")
      .attr("class", "label-main")
      .attr("x", (d) => d.x + 14)
      .attr("y", (d) => d.y - 4)
      .style("font-size", "15px")
      .style("fill", "#333");

    // Fettes d.result
    labelMain.append("tspan")
      .text(d => d.result + " – ")
      .style("font-weight", "600");

    // Leichtes d.name
    labelMain.append("tspan")
      .text(d => d.name)
      .style("font-weight", "300");   // oder "normal"

    // Untertitel
    const labelSub = layerLabels.selectAll("text.label-sub")
      .data(positioned)
      .enter()
      .append("text")
      .attr("class", "label-sub")
      .attr("x", (d) => d.x + 14)
      .attr("y", (d) => d.y + 14)
      .text((d) => `${d.deviceName ?? "Unbekanntes Smartphone"} – ${this.formatDate(d.eventTime ?? "")}`)
      .style("font-size", "12px")
      .style("fill", "#666");

    //
    // 7) BACKGROUND-RECT hinter Labels (aber über Linie)
    //
    setTimeout(() => {
      layerLabels.selectAll("rect.label-bg").remove();

      labelMain.each(function(_, i) {

        const mainNode = this as SVGTextElement;
        const subNode = labelSub.nodes()[i] as SVGTextElement;

        const mainBB = mainNode.getBBox();
        const subBB = subNode.getBBox();

        const x = Math.min(mainBB.x, subBB.x) - 4;
        const y = mainBB.y - 2;
        const width = Math.max(mainBB.width, subBB.width) + 8;
        const height = (subBB.y + subBB.height - mainBB.y) + 4;

        d3.select(mainNode.parentNode as Element)
          .insert("rect", ":first-child")
          .attr("class", "label-bg")
          .attr("x", x)
          .attr("y", y)
          .attr("width", width)
          .attr("height", height)
          .attr("rx", 5)
          .attr("ry", 5)
          .attr("fill", "white");
      });
    }, 10);


  }


  private colorByResult(result: string): string {
    switch (result) {
      case 'Fehler': return 'orange';
      case 'Freigegeben': return 'blue';
      case 'Entsperrt': return 'green';
      default: return 'gray';
    }
  }

  private xByResult(result: string): number {
    switch (result) {
      case 'Fehler': return 150;
      case 'Freigegeben': return 350;
      case 'Entsperrt': return 550;
      default: return 400;
    }
  }

  private formatDate(date: string | Date): string {
    return new Date(date).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }






}
