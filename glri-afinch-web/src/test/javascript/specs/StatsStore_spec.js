initializeLogging();
beforeEach(function(){
    this.addMatchers({
        /**
         * Ensures that an object has the specified keys. Does not check to see
         * if the properties have the value undefined.
         * @param keys - an array of strings
         */
        toHaveKeys: function(keys){
            var notText = this.isNot ? " not" : "";

            this.message = function(){
                return "Expected object" + notText +  " to contain keys " + keys.join(', ');
            };
            var key;
            for(var i = 0; i < keys.length; i++){
                key = keys[i];
                if(!(key in this.actual)){
                    return false;
                }
            }
            return true;
        },
        /**
         * Check the suspect object to see if it contains the desired keys and if the keys are defined
         * @param suspect - an object to test for the keys specified in this.actual
         */
        toBeDefinedIn: function(suspectObj){
            //duck-typing
            if("undefined" === typeof this.actual.length){
                throw new Error("you must supply an array of string keys to check");
            }

            var notText = this.isNot ? " not" : "";
            var keysToTestFor = this.actual;
            this.message = function(){
                return "Expected object" + notText +  " to have the following properties defined: " + keysToTestFor.join(', ');
            };
            var key;
            for(var i = 0; i < keysToTestFor.length; i++){
                key = keysToTestFor[i];
                if(!(
                    (key in suspectObj) && (suspectObj[key] !== undefined)
                    )){
                    return false;
                }
            }
            return true;
        }
    });
});

describe('StatsStore.js', function(){

    it('implements the memoized load function', function(){
       expect(AFINCH.data.statsStoreLoad).toBeDefined();
    });

    it('overrides the generic Ext.data.Store functions', function(){
        var ss = new AFINCH.data.StatsStore();
        var genericStore = new Ext.data.Store();

        var funcNames = ['constructor', 'load', 'rParse'];
        expect(funcNames).toBeDefinedIn(ss);

        funcNames.each(function(name){
           expect(ss[name]).not.toBe(genericStore[name]);
        });

    });
    describe('AFINCH.data.StatsStore.rParse', function(){
        var ss = new AFINCH.data.StatsStore();
        var rParse = ss.rParse;

        /**
         * @param array of column header strings
         */
        var stringifyHeaders = function(columnHeaders){
            var stringifiedHeaders = columnHeaders.map(
            function(header){
                return '"' + header + '"';
            }
            );
           return stringifiedHeaders.join(',') + '\n';
        };

        /**
         * @param array of array of floats
         */
        var stringifyValues = function(values){
            return values.reduce(
                function(prevString, row){
                    return prevString + row.join(',') + "\n";
                },
           "");
        };

        var verifyTableHasCorrectFields = function(table){
            expect(['title','headers','values']).toBeDefinedIn(table);
        };

        it('should error when called with no params', function(){
            expect(rParse).toThrow();
        });
        it('should error when called with a zero-length string', function(){
            expect(function(){rParse('');}).toThrow();
        });
        it('should return the right object for a single-table, single-column, single-row string', function(){
           var tableTitle = 'myTable';
           var columnHeaders = ['column1'];
           var values = ['0'];
           var input = tableTitle+'\n"'+ columnHeaders[0] + '"\n' + values[0];
           var tables = rParse(input);
           expect(tables.length).toBe(1);
           var table = tables[0];
           verifyTableHasCorrectFields(table);
           expect(table.title).toBe(tableTitle);
           expect(table.headers.length).toBe(1);
           expect(table.headers[0]).toBe(columnHeaders[0]);
           expect(table.values.length).toBe(1);
           expect(table.values[0].length).toBe(1);
           expect(table.values[0][0]).toBe(0);
        });

		/**
		 * Helper function
		 * @param {string} input - the rwps output to parse
		 * @param {string} message - the expectation message you would write in a jasmine `it('should...' function(){})` call
		 * @param {string} expectedSerialization - the serialized version of the parsed object
		 * @returns {undefined}
		 */
		function testTable(input, message, expectedSerialization){
           it(message, function(){
				var tables = rParse(input);
			   expect(JSON.stringify(tables)).toBe(expectedSerialization);
			   //now try with a trailing newline
			   tables = rParse(input + "\n");
			   expect(JSON.stringify(tables)).toBe(expectedSerialization);
		   });
		};

		var smallSerialization = '[{"title":"myTable","headers":["col1","col2","col3"],"values":[[0.1,0.2,0.3],[0.4,0.5,0.6],[0.7,0.8,0.9]]}]';

		testTable(
			'myTable\n'+
			'"col1","col2","col3"\n' +
			'0.1,0.2,0.3\n'+
			'0.4,0.5,0.6\n'+
			'0.7,0.8,0.9',

			'should return the right object for a single-table, 3-column, 3-row string',
			smallSerialization
		   );
		testTable(
			'myTable\n'+
			'"col1","col2","col3"\n' +
			'"0.1",0.2,0.3\n'+
			'"0.4",0.5,0.6\n'+
			'0.7,\'0.8\',0.9',

			'should return the right object for a single-table, 3-column, 3-row string with some quoted values',
			smallSerialization
		   );
		testTable(
			'myTable\n'+
			'"col1","col2","col3"\n' +
			'NA,0.2,0.3\n'+
			'0.4,NA,NA\n'+
			'NA,NA,NA',

			'should return the right object for a single-table, 3-column, 3-row string with "NA" values',
			'[{"title":"myTable","headers":["col1","col2","col3"],"values":[[null,0.2,0.3],[0.4,null,null],[null,null,null]]}]'
		   );

		testTable(
			'myTable\n'+
			'"col1","col2","col3"\n' +
			'0.1,0.2,0.3\n'+
			'0.4,0.5,0.6\n'+
			'0.7,0.8,0.9\n'+
			'myTable2\n'+
			'"col4","col5","col6"\n' +
			'0.4,0.5,0.6\n'+
			'0.1,0.2,0.3\n'+
			'0.7,0.8,0.9\n'+
			'myTable3\n'+
			'"col7","col8","col9"\n' +
			'0.4,0.5,0.6\n'+
			'0.7,0.8,0.9\n'+
			'0.1,0.2,0.3\n',

			'should return the right object for a 3-table, 3-column, 3-row string',

			'[{"title":"myTable","headers":["col1","col2","col3"],"values":[[0.1,0.2,0.3],[0.4,0.5,0.6],[0.7,0.8,0.9]]},{"title":"myTable2","headers":["col4","col5","col6"],"values":[[0.4,0.5,0.6],[0.1,0.2,0.3],[0.7,0.8,0.9]]},{"title":"myTable3","headers":["col7","col8","col9"],"values":[[0.4,0.5,0.6],[0.7,0.8,0.9],[0.1,0.2,0.3]]}]'
		   );


		it('should throw an error if the data cannot be parsed', function(){
			var expectedError = (AFINCH.data.RParseError());
			expect(
					//non-numeric values
				function(){rParse(
					'myTable\n'+
					'"col1","col2","col3"\n' +
					'"0.1a",0.2,0.3\n'+
					'"0.4",0.5,0.6\n'+
					'0.7,0.8,0.9'
					);}
				).toThrow(expectedError);
			expect(
					//space in table name
				function(){rParse(
					'my Table\n'+
					'"col1","col2","col3"\n' +
					'"0.1",0.2,0.3\n'+
					'"0.4",0.5,0.6\n'+
					'0.7,0.8,0.9'
					);}
				).toThrow(expectedError);
			expect(
					//illegal character in table name
				function(){rParse(
					'myTable#\n'+
					'"col1","col2","col3"\n' +
					'"0.1",0.2,0.3\n'+
					'"0.4",0.5,0.6\n'+
					'0.7,\'0.8\',0.9'
					);}
				).toThrow(expectedError);
		});
    });
});
