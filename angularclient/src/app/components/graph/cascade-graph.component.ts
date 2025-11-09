import { Component, ElementRef, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { RcuService } from '../../services/rcu.service';
import { SmartphoneService } from '../../services/smartphone.service';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cascade-graph',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cascade-graph.component.html',
  styleUrls: ['./cascade-graph.component.scss']
})
export class CascadeGraphComponent implements OnInit {
  constructor(
    private el: ElementRef, // Referenz auf das HTML-Element der Komponente, um auf das SVG zuzugreifen
    private rcuService: RcuService,
    private smartphoneService: SmartphoneService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.buildDataAndRender();
  }

  async buildDataAndRender() {
    // Alle Rcus, Smartphones und Users laden
    const rcus = await this.rcuService.getAllRcus().toPromise();
    const smartphones = await this.smartphoneService.getAll().toPromise();
    const users = await this.userService.getAllUsers().toPromise();

    // Hierarchie des Baums definieren (RCUs -> Smartphones -> Users)
    const trees = (rcus ?? []).map((rcu: any) => ({
      name: rcu.name || `RCU ${rcu.id}`,
      children: (smartphones ?? [])
        .filter((sp: any) => rcu.allowedSmartphones?.some((s: any) => s.id === sp.id))
        .map((sp: any) => ({
          name: sp.name || sp.deviceId,
          children: (sp.assignedUsers ?? []).map((u: any) => ({
            name: u.username || u.email
          }))
        }))
    }));

    // Übergibt die fertige Baumstruktur an die Rendering-Funktion
    this.renderMultipleTrees(trees);
  }

  // Funktion zum Rendern mehrerer Bäume in einem einzigen SVG-Element
  renderMultipleTrees(trees: any[]) {
    // Zugriff auf das SVG im Template über ElementRef
    const element = this.el.nativeElement.querySelector('svg');
    // Ermittelt die Basisbreite und -höhe aus der aktuellen SVG-Größe oder setzt Standardwerte
    const baseWidth = element.clientWidth || 1200;
    const baseHeight = element.clientHeight || 800;

    // Initialisiert das SVG mit dynamischer Größe und passender viewBox
    const svg = d3.select(element)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${baseWidth} ${baseHeight}`);

    // Hauptgruppe, in die alle weiteren Elemente gezeichnet werden
    const g = svg.append('g');

    // Fügt Zoom- und Pan-Funktionalität hinzu
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    // Zählt die Gesamtanzahl der Knoten in allen Trees (für proportionalen Platzbedarf)
    const totalNodeCount = trees.reduce((acc, t) => acc + this.countNodes(t), 0);
    let currentTop = 50; // Start-Offset von oben

    // Jeder Tree wird nacheinander im SVG platziert
    trees.forEach((data, i) => {
      const nodeCount = this.countNodes(data); // Anzahl der Knoten im aktuellen Tree
      // Höhe des Bereichs für diesen Tree proportional zur Knotenzahl
      const relativeHeight = (nodeCount / totalNodeCount) * (baseHeight - 100); // proportionaler Anteil
      const root = d3.hierarchy(data); // Konvertiert die JSON-Hierarchie in eine D3-Struktur

      // Dynamische Layoutgröße für den aktuellen Tree (min. 150 Pixel Höhe)
      const availableHeight = Math.max(150, relativeHeight) + 50;
      const availableWidth = baseWidth;

      // Erstellt ein Baum-Layout-Objekt mit definierter Größe
      const treeLayout = d3.tree().size([availableHeight, availableWidth]);
      treeLayout(root);

      // Neue Gruppe (<g>) für den Tree (damit sie unabhängig transformiert werden kann)
      const treeGroup = g.append('g')
        .attr('class', `tree-group-${i}`)
        .attr('transform', `translate(0,${currentTop})`);

      // Generator für Verbindungslinien (Links) zwischen Eltern- und Kindknoten
      const linkGen = d3
        .linkHorizontal<d3.HierarchyPointLink<any>, d3.HierarchyPointNode<any>>()
        .x((d: any) => d.y) // horizontale Position (X)
        .y((d: any) => d.x); // vertikale Position (Y)

      // Zeichnet die Verbindungslinien zwischen den Knoten
      treeGroup.selectAll(`path.link-${i}`)
        .data(root.links()) // Daten: alle Verbindungen im Baum
        .enter()
        .append('path')
        .attr('class', `link link-${i}`)
        .attr('d', (d: any) => linkGen(d)) // Pfadkoordinaten erzeugen
        .attr('stroke', '#aaa') // Linienfarbe grau
        .attr('stroke-width', 1.5)
        .attr('fill', 'none'); // keine Füllung (nur Linien)

      // Zeichnet die Knoten (Nodes)
      const node = treeGroup.selectAll(`g.node-${i}`)
        .data(root.descendants()) // alle Knoten (inkl. Kinder)
        .enter()
        .append('g')
        .attr('class', `node node-${i}`)
        .attr('transform', (d: any) => `translate(${d.y},${d.x})`); // Positionierung nach Layout

      // Kreis für jeden Knoten (symbolisiert RCU, Smartphone oder User)
      node.append('circle')
        .attr('r', 6) // Radius des Kreises
        .attr('fill', '#fff') // Hintergrundfarbe weiß
        .attr('stroke', (d: any) => this.colorByDepth(d.depth)) // Farbe abhängig von Tiefe (Ebene)
        .attr('stroke-width', 2); // Kreisranddicke

      // Textbeschriftung der Knoten
      node.append('text')
        .attr('text-anchor', (d: any) => d.depth === 2 ? 'start' : 'middle') // Usernamen rechtsbündig
        .attr('dx', (d: any) => d.depth === 2 ? 10 : 0)  // nach rechts versetzt
        .attr('dy', (d: any) => d.depth === 2 ? '0.35em' : '1.2em') // vertikal mittig
        .text((d: any) => d.data.name)
        // Schriftgröße dynamisch anpassen (min 10px, max 20px)
        .style('font-size', `${Math.min(Math.max(10, availableHeight / 10), 20)}px`)
        .style('fill', '#333');

      // Verschiebt Startpunkt für nächsten Tree weiter nach unten
      currentTop += availableHeight;
    });

    // Automatische Skalierung und Zentrierung aller Bäume im SVG
    const bounds = g.node()!.getBBox(); // Grenzen (Bounding Box) aller gezeichneten Elemente
    const padding = 20;// zusätzlicher Rand jedes Baums
    const scale = Math.min(
      baseWidth / (bounds.width + padding * 2),
      baseHeight / (bounds.height + padding * 2),
      1.2 // maximale Skalierung
    );

    // Berechnet Verschiebung (Translation), um alles zu zentrieren
    const offsetX = (baseWidth - bounds.width * scale) / 2 - bounds.x * scale;
    const offsetY = (baseHeight - bounds.height * scale) / 2 - bounds.y * scale;

    // Wendet die Transformation (Zentrierung + Skalierung) an
    g.attr('transform', `translate(${offsetX},${offsetY}) scale(${scale})`);
  }

  // Farben nach Ebene
  colorByDepth(depth: number): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']; // Blau, Grün, Orange, <Rot>
    return colors[depth % colors.length];
  }

  // Berechnet die maximale Tiefe eines Baumes (nicht direkt verwendet)
  private getMaxDepth(tree: any): number {
    if (!tree.children || tree.children.length === 0) return 1;
    return 1 + Math.max(...tree.children.map((c: any) => this.getMaxDepth(c)));
  }

  // Zählt alle Knoten im Baum (rekursiv)
  private countNodes(tree: any): number {
    if (!tree.children || tree.children.length === 0) return 1;
    return 1 + tree.children.reduce((acc: number, c: any) => acc + this.countNodes(c), 0);
  }

  resetView() {
    const element = this.el.nativeElement.querySelector('svg');
    const g = d3.select(element).select('g');

    if (g.empty()) return;

    // Gleiche Dimensionen wie beim Rendern
    const baseWidth = element.clientWidth || 1200;
    const baseHeight = element.clientHeight || 800;

    // Grenzen (Bounding Box) der gesamten Graphengruppe
    const bounds = (g.node() as SVGGElement).getBBox();
    const padding = 20;

    // Berechnet den Skalierungsfaktor, gleiche Logik wie beim Rendern
    const scale = Math.min(
      baseWidth / (bounds.width + padding * 2),
      baseHeight / (bounds.height + padding * 2),
      1.2
    );

    // Berechnet die Verschiebung, um den Graph mittig zu platzieren
    const offsetX = (baseWidth - bounds.width * scale) / 2 - bounds.x * scale;
    const offsetY = (baseHeight - bounds.height * scale) / 2 - bounds.y * scale;

    // Übergang mit Animation (600 ms)
    g.transition()
      .duration(600)
      .attr('transform', `translate(${offsetX},${offsetY}) scale(${scale})`);
  }

  reloadGraph() {
    const element = this.el.nativeElement.querySelector('svg');
    const svg = d3.select(element);

    // Entfernt alle bisherigen Gruppen (damit der Graph nicht doppelt gezeichnet wird)
    svg.selectAll('*').remove();

    // Baut alles neu auf
    this.buildDataAndRender();
  }

}
