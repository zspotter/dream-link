
var svgcon = document.getElementById("svgcontainer");
var width = svgcon.offsetWidth,
	height = svgcon.offsetHeight;

var svg = d3.select("#svgcontainer").append("svg")
		.attr("width", width)
		.attr("height", height)

var nodes = [],
	links = [];

var force = d3.layout.force()
	.nodes(nodes)
	.links(links)
	.size([width, height])
	.linkDistance(80)
	.charge(-300)
	.gravity(0.02)
	.on("tick", tick);

var link = svg.selectAll(".link"),
	node = svg.selectAll(".node");

function tick() {
	link
		.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });

	node
		.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
}

function mouseover() {
	d3.select(this).select("circle").transition()
		.duration(150)
		.attr("r", function(d) {
			if (isExpandable(d.id)) return 12;
			else return (d.type == "tag")? 8 : 12;
		});
}

function mouseout() {
	d3.select(this).select("circle").transition()
		.duration(300)
		.attr("r", function(d) {
			return (d.type == "tag")? 8 : 12;
		});
}

function click(d) {
	if (d.type != "tag") return;
	expandNode(d.id);
	d3.select(this).select("circle")
		.style("stroke", function(d) {
			return (isExpandable(d.id))? "#6A429E" : "#FFFFFF";
		});
}

function updateNodes() {
	link = link.data(force.links(), function(d) { return d.source.id + "-" + d.target.id; });
	link.enter().insert("line", ".node")
		.attr("class", "link");

	link.exit().remove();

	node = node.data(force.nodes(), function(d) { return d.id; });
	var entry = node.enter().append("g")
		.attr("class", "node")
		.on("mouseover", mouseover)
		.on("mouseout", mouseout)
		.on("click", click)
		.call(force.drag)

	entry.append("circle")
		.attr("r", function(d) {
			return (d.type == "key")? 12 : 8;
		})
		.style("fill", function(d) { 
			if (d.isRoot) return "#F2E738";
			return (d.type == "key")? "#c6dbef" : "#B392DE"; 
		})
		.style("stroke", function(d) {
			return (d.type != "key" && isExpandable(d.id))? "#6A429E" : "#FFFFFF";
		});
	
	entry.append("text")
		.attr("x", 10)
		.attr("dy", ".35em")
		.text(function(d) {
			return (d.type == "tag")? d.id : "";
		});

	node.exit().remove();

	force.start();
}

function isExpandable(id) {
	// only expandable if valid id, is already in graph, isnt expanded yet, and has link targets not yet in graph
	var n = dreamCache[id];
	if (!n || !n.ingraph || n.expanded) return false;

	// return true if any link targets not in graph
	return n.links.some(function(lnk) {
		//console.log("__", n.node.id, "link", lnk.target.id, "ingraph", dreamCache[lnk.target.id].ingraph);
		return !dreamCache[lnk.target.id].ingraph;
	});
}

function updateRings() {
	// Update ring colors
	console.log("update rings");
	d3.selectAll("circle")
		.style("stroke", function(d) {
			return (d.type != "key" && isExpandable(d.id))? "#6A429E" : "#FFFFFF";
		});
}

// contains id's mapped to {expanded, ingraph, node, links} where node is a node and link is a list of id's
var dreamCache = {}; 

function expandNode(nid, noupdate) {
	if (!isExpandable(nid)) {
		console.log("not expandable", nid);
		return;
	};

	var cdream = dreamCache[nid];
	cdream.expanded = true;

	console.log("expanding cdream", cdream.node.id);

	// Expand from cache
	var cacheTags = [];
	var newKeys = [];
	cdream.links.forEach(function(lnk) {
		// Dont push link if the link or its reverse link is already in list
		var nolink = true;
		links.some(function(prelnk) {
			if ((prelnk.source == lnk.source && prelnk.target == lnk.target) 
				|| (prelnk.source == lnk.target && prelnk.target == lnk.source)) {
				nolink = false;
				return true;
			}
			return false;
		});
		if (nolink) { 
			console.log(" pushing link", lnk.source.id, "->", lnk.target.id);
			links.push(lnk);
		}
		if (!dreamCache[lnk.target.id].ingraph) {
			console.log(" pushing", lnk.target.type, "node", lnk.target.id);
			nodes.push(lnk.target);
			if (lnk.target.type === "key") newKeys.push(lnk.target);
			dreamCache[lnk.target.id].ingraph = true;
			
			// Node added to graph, so cache its own connections
			if (lnk.target.type === "tag") {
				cacheTags.push(lnk.target.id);
			}
		}
	});
	// Start next cache
	if (cacheTags.length > 0) cacheNodes(cacheTags, "tag", updateRings);
	// if any key nodes where expanded, expand those before updating
	newKeys.forEach(function(knode) {
		console.log("double extend", knode.id);
		expandNode(knode.id, true);
	});
	// Update recently expanded
	if (!noupdate) updateNodes();
}

function cacheNodes(nids, ntype, callback) {
	ntype = ntype || "tag";
	if (typeof nids === "string") nids = [nids];

	d3.json("/app/dream?"+ntype+"="+nids.join(), function(json) {
		console.log("cache request ", nids, " yields ", json);
		if (!json) {
			if (callback) callback();
			return;
		}

		// Link up each dream in json object
		json.forEach(function(dream) {
			// If dream already in cache, skip it
			if (dreamCache[dream.key]) return;

			// Create dream node and link it to existing nodes based on tags
			var dreamNode = {id: dream.key, type: "key", isRoot: (dream.key === root_id)};
			dreamCache[dream.key] = {expanded: false, ingraph: false, node: dreamNode, links:[]};
			dream.tags.forEach(function(tag) {
				// Look for already existing tag node
				var tagNode = dreamCache[tag]? dreamCache[tag].node : {id: tag, type: "tag"};
				if (!dreamCache[tag]) {
					dreamCache[tag] = {expanded: false, ingraph: false, node: tagNode, links:[]};
				}
				dreamCache[tag].links.push({source: tagNode, target: dreamNode});
				dreamCache[dream.key].links.push({source: dreamNode, target: tagNode});
			});
		});
		if (callback) callback();
	});
}

var root_id = window.location.pathname.split("/").pop();
cacheNodes(root_id, "key", function() {
	if (!dreamCache[root_id]) {
		// Root dream not found!
		window.alert("Dream could not be loaded!");
		return;
	}
	// add root to graph, then expand it
	nodes.push(dreamCache[root_id].node);
	dreamCache[root_id].ingraph = true;
	console.log("added root node", dreamCache);
	// expand root
	expandNode(root_id);
});

