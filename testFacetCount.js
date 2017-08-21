const testFacets =
		{
			keyword: {
				best: 2,
				test: 5,
				none: 1,
        why: 1,
			},
			theme: {
				lost: 10,
				bots: 2,
				one: 14
			}
		};

const testFacets2 =
{
  keyword: [
    {'best': 2},
    {'none': 1},
    {'test': 5},
  ],
  theme: [
    {'lost': 10},
   {'one': 14},
    {'bots': 2}
  ]
  };

const testFacetsArray =
{
  keyword: [
    ['best', 2],
    ['none', 1],
    ['test', 5],

  ],
  theme: [
    ['lost', 10],
    ['one', 14],
    ['bots', 2]
  ]
};

const sorted = {};
Object.keys(testFacets).forEach(function(facet) {
  
  sorted[facet] = [];
  sorted[facet] = Object.entries(testFacets[facet]).sort(function(a,b) {
    return (a[1] > b[1]) ? -1 : ((b[1] > a[1]) ? 1 : 0)
  });
   
  
});


console.log(testFacets);
console.log(sorted);
