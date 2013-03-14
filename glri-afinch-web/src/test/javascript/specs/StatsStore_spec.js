initializeLogging();



describe('StatsStore.js', function(){
    
    it('implements the memoized load function', function(){
       expect(AFINCH.data.statsStoreLoad).toBeDefined();
    });
    
    it('overrides the generic Ext.data.Store functions', function(){
        var ss = new AFINCH.data.StatsStore();
        var genericStore = new Ext.data.Store();
        
        var funcNames = ['constructor', 'load', 'rParse'];
        funcNames.each(function(name){
           expect(ss[name].toBeDefined);
           expect(ss[name]).not.toBe(genericStore[name]);
        });
        
    });
    describe('AFINCH.data.statsStoreLoad', function(){
        var ss = new AFINCH.data.StatsStore();
        var rParse = ss.rParse;
        it('should error when called with no params', function(){
            expect(rParse).toThrow();
        });
        it('should error when called with a zero-length string', function(){
            expect(function(){rParse('');}).toThrow();
        });

    });
});
