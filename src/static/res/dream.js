
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
		.attr("r", 12);
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
	expand(d);
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
			return (d.type == "key")? "#c6dbef" : "#fd8d3c"; 
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

function expand(d) {
	if (d.expanded) return;
	d.expanded = true;
	d3.json("/app/dream?"+d.type+"="+d.id, function(json) {
		console.log("JSON: ", json);
		// Link up each dream in json object
		json.forEach(function(dream) {
			// Check if dream is already in graph
			var dreamed = nodes.some(function(n) {
				return n.id == dream.key;
			});
			// If dream already in graph, skip it
			if (dreamed) return;

			// Create dream node and link it to existing nodes based on tags
			var dreamNode = {id: dream.key, type: "key"};
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
					console.log("add tag "+tag);
					tagNode = {id: tag, type: "tag"};
					nodes.push(tagNode);
				}
				links.push({source: dreamNode, target: tagNode});
			});
		});
		updateNodes();
	});
}

var dream_id = window.location.pathname.split("/").pop();
expand({type: "key", id: dream_id});

