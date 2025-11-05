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
    private el: ElementRef,
    private rcuService: RcuService,
    private smartphoneService: SmartphoneService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.buildDataAndRender();
  }

  async buildDataAndRender() {
    const rcus = await this.rcuService.getAllRcus().toPromise();
    const smartphones = await this.smartphoneService.getAll().toPromise();
    const users = await this.userService.getAllUsers().toPromise();

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

    this.renderMultipleTrees(trees);
  }

  renderMultipleTrees(trees: any[]) {
    const element = this.el.nativeElement.querySelector('svg');
    const baseWidth = element.clientWidth || 1200;
    const baseHeight = element.clientHeight || 800;

    const svg = d3.select(element)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${baseWidth} ${baseHeight}`);

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    // Gesamtanzahl der Knoten aller Trees → für relative Höhenverteilung
    const totalNodeCount = trees.reduce((acc, t) => acc + this.countNodes(t), 0);
    let currentTop = 50; // Start-Offset von oben

    trees.forEach((data, i) => {
      const nodeCount = this.countNodes(data);
      const relativeHeight = (nodeCount / totalNodeCount) * (baseHeight - 100); // proportionaler Anteil
      const root = d3.hierarchy(data);

      // Dynamische Layoutgröße für jeden Tree
      const availableHeight = Math.max(150, relativeHeight) + 50;
      const availableWidth = baseWidth;

      const treeLayout = d3.tree().size([availableHeight, availableWidth]);
      treeLayout(root);

      // Neue <g>-Gruppe für jeden Tree (eindeutiger Bereich)
      const treeGroup = g.append('g')
        .attr('class', `tree-group-${i}`)
        .attr('transform', `translate(0,${currentTop})`);

      // Verbindungen (Links)
      const linkGen = d3
        .linkHorizontal<d3.HierarchyPointLink<any>, d3.HierarchyPointNode<any>>()
        .x((d: any) => d.y)
        .y((d: any) => d.x);

      treeGroup.selectAll(`path.link-${i}`)
        .data(root.links())
        .enter()
        .append('path')
        .attr('class', `link link-${i}`)
        .attr('d', (d: any) => linkGen(d))
        .attr('stroke', '#aaa')
        .attr('stroke-width', 1.5)
        .attr('fill', 'none');

      // Knoten
      const node = treeGroup.selectAll(`g.node-${i}`)
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('class', `node node-${i}`)
        .attr('transform', (d: any) => `translate(${d.y},${d.x})`);

      node.append('circle')
        .attr('r', 6)
        .attr('fill', '#fff')
        .attr('stroke', (d: any) => this.colorByDepth(d.depth))
        .attr('stroke-width', 2);

      node.append('text')
        .attr('text-anchor', (d: any) => d.depth === 2 ? 'start' : 'middle') // Usernamen rechtsbündig
        .attr('dx', (d: any) => d.depth === 2 ? 10 : 0)  // nach rechts versetzt
        .attr('dy', (d: any) => d.depth === 2 ? '0.35em' : '1.2em') // vertikal mittig
        .text((d: any) => d.data.name)
        .style('font-size', `${Math.min(Math.max(10, availableHeight / 10), 20)}px`)
        .style('fill', '#333');

      // Nächster Tree weiter unten
      currentTop += availableHeight;
    });

    // Automatische Skalierung und Zentrierung
    const bounds = g.node()!.getBBox();
    const padding = 20;
    const scale = Math.min(
      baseWidth / (bounds.width + padding * 2),
      baseHeight / (bounds.height + padding * 2),
      1.2
    );

    const offsetX = (baseWidth - bounds.width * scale) / 2 - bounds.x * scale;
    const offsetY = (baseHeight - bounds.height * scale) / 2 - bounds.y * scale;

    g.attr('transform', `translate(${offsetX},${offsetY}) scale(${scale})`);
  }

  // Farben nach Ebene
  colorByDepth(depth: number): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    return colors[depth % colors.length];
  }

  // Maximale Tiefe eines Trees
  private getMaxDepth(tree: any): number {
    if (!tree.children || tree.children.length === 0) return 1;
    return 1 + Math.max(...tree.children.map((c: any) => this.getMaxDepth(c)));
  }

  // Knotenzähler
  private countNodes(tree: any): number {
    if (!tree.children || tree.children.length === 0) return 1;
    return 1 + tree.children.reduce((acc: number, c: any) => acc + this.countNodes(c), 0);
  }
}
