
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
			if (!expanded[d.id]) return 12;
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
	expand(d.type, d.id);
	d3.select(this).select("circle")
		.style("stroke", function(d) {
			return (!expanded[d.id])? "#6A429E" : "#FFFFFF";
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
			return (d.type != "key" && !expanded[d.id])? "#6A429E" : "#FFFFFF";
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

var expanded = {};

function expand(ntype, nid, doCache) {
	if (expanded[nid]) return;
	expanded[nid] = true;

	// Expand from cache
	/*
	if (dreamCache[nid]) {
		var cdream = dreamCache[nid];
		links.concat(cdream.links);
		cdream.links.forEach(function(li) {
			if (dreamCache[li.target.id]) {
				nodes.push(dreamCache[li.target.id].node)
				dreamCache[li.target.id] = null;
			}
		});
		dreamCache[nid] = null;
		updateNodes();
		return;
	}
	*/

	// Or query and expand
	d3.json("/app/dream?"+ntype+"="+nid, function(json) {
		console.log("JSON: ", json);
		if (!json) {
			expanded[nid] = false;
			return;
		}
		// Link up each dream in json object
		json.forEach(function(dream) {
			// Check if dream is already in graph
			var dreamed = nodes.some(function(n) {
				return n.id == dream.key;
			});
			// If dream already in graph, skip it
			if (dreamed) return;

			// Create dream node and link it to existing nodes based on tags
			var dreamNode = {id: dream.key, type: "key", isRoot: (dream.key == nid)};
			expanded[dream.key] = true;
			nodes.push(dreamNode);
			dream.tags.forEach(function(tag) {
				// Look for already existing tag node
				var tagNode = null;
				nodes.some(function(n) {
					if (n.id == tag) {
						tagNode = n;
						return true;
					}
					return false;
				});
				if (tagNode === null) {
					tagNode = {id: tag, type: "tag"};
					nodes.push(tagNode);
				}
				expanded[tag] = dreamNode.isRoot;
				links.push({source: dreamNode, target: tagNode});
			});
		});
		updateNodes();
		//if (doCache) cacheNodes();
	});
}

/*
var dreamCache = {};

function cacheNodes() {
	var tags = [];
	for (var nid in expanded) {
		if (!expanded[nid]) tags.push(nid);
	}

	d3.json("/app/dream?tag="+tags.join(), function(json) {
		console.log("cache JSON: ", json);
		if (!json) return;

		// Link up each dream in json object
		json.forEach(function(dream) {
			// Check if dream is already in graph
			var dreamed = nodes.some(function(n) {
				return n.id == dream.key;
			});
			// If dream already in graph, skip it
			if (dreamed) return;

			// Create dream node and link it to existing nodes based on tags
			var dreamNode = {id: dream.key, type: "key", isRoot: false};
			expanded[dream.key] = true;
			dreamCache[dream.key] = {node: dreamNode, links:[]};
			dream.tags.forEach(function(tag) {
				// Look for already existing tag node
				var tagNode = null;
				nodes.some(function(n) {
					if (n.id == tag) {
						tagNode = n;
						return true;
					}
					return false;
				});
				if (tagNode === null) {
					tagNode = {id: tag, type: "tag"};
					dreamCache[tag] = {node: tagNode, link:[]};
				}
				expanded[tag] = dreamNode.isRoot;
				dreamCache[dream.key].links.push({source: dreamNode, target: tagNode});
			});
		});
	});
}
*/

var dream_id = window.location.pathname.split("/").pop();
expand("key", dream_id, true);

