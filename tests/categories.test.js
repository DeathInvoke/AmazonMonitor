
describe('Test categories', ()=>{
  it('should work', () => {
    const test = {
      "Abbgliamento": [{
        "Donna": {
          url: 'www'
        }
      }]
    };

    let obj = Object.fromEntries(test)
    console.log(obj)
  })
})