// this can be used in http://beta.json-generator.com/N6n_0tG to generate marker json file

[
  '{{repeat(30, 100)}}',
  {
    storeId: '{{index(2200)}}',
    name: 'Store no. {{index()}}',
    url: '/myymalat/{{index()}}/',
    address: '{{street()}} {{integer(1, 100)}}',
    postalCode: '{{integer(100, 60000)}}',
    locality: '{{random("Helsinki", "Vantaa", "Espoo", "Kauniainen", "Kirkkonummi", "Tampere", "Turku", "Pirkkala")}}',
    latitude: '{{floating(60.097718, 63.184108)}}',
    longitude: '{{floating(22.17041, 27.773438)}}'
  }
]