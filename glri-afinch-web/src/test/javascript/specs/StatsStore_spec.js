describe('StatsStore.js', function(){
    it('implements the memoized load function', function(){
       expect(AFINCH.data.statsStoreLoad).toBeDefined();
    });

    it('overrides the generic Ext.data.Store functions', function(){
        var ss = new StatsStore();
        var genericStore = new Ext.data.Store();
        
        var funcNames = ['constructor', 'load', 'rParse'];
        funcNames.each(function(name){
           expect(ss[name].toBeDefined);
           expect(ss[name].not.toBe(genericStore[name]));
        });
        
    }); 
});
