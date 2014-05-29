package gov.usgs.cida.glri.afinch.netcdfagg;

import org.joda.time.DateTime;
import org.joda.time.Days;
import org.joda.time.DurationFieldType;
import org.joda.time.Hours;
import org.joda.time.Interval;
import org.joda.time.Minutes;
import org.joda.time.Months;
import org.joda.time.ReadablePeriod;
import org.joda.time.Seconds;
import org.joda.time.Weeks;
import org.joda.time.Years;
import org.joda.time.base.AbstractPeriod;
import org.joda.time.base.BaseSingleFieldPeriod;

/**
 *
 * @author tkunicki
 * 
 * NOTE: Source copied fro GDP's Derivative Processing submodule
 * 
 */
public class PeriodUtility {
    
    public static ReadablePeriod optimize(ReadablePeriod readablePeriod) {
        if (readablePeriod instanceof BaseSingleFieldPeriod) {
            // already optimized
            return readablePeriod;
        }
        if (readablePeriod instanceof AbstractPeriod) {
            
            AbstractPeriod abstractPeriod = (AbstractPeriod) readablePeriod;
            DurationFieldType[] fieldTypes = abstractPeriod.getFieldTypes();
            
            // determine if period has only one field set
            DurationFieldType singleNonZeroFieldType = null;
            int singleNonZeroFieldValue = 0;
            for (DurationFieldType fieldType : fieldTypes) {
                int fieldValue = abstractPeriod.get(fieldType);
                if (fieldValue != 0) {
                    if (singleNonZeroFieldType == null) {
                        singleNonZeroFieldType = fieldType;
                        singleNonZeroFieldValue = fieldValue;
                    } else {
                        // can't optimize, multiple fields are set
                        return readablePeriod;
                    }
                }
            }
            
            if (singleNonZeroFieldType != null && singleNonZeroFieldValue != 0) {
                if (singleNonZeroFieldType == DurationFieldType.years()) {
                    return Years.years(singleNonZeroFieldValue);
                } else if (singleNonZeroFieldType == DurationFieldType.months()) {
                    return Months.months(singleNonZeroFieldValue);
                } else if (singleNonZeroFieldType == DurationFieldType.weeks()) {
                    return Weeks.weeks(singleNonZeroFieldValue);
                } else if (singleNonZeroFieldType == DurationFieldType.days()) {
                    return Days.days(singleNonZeroFieldValue);
                } else if (singleNonZeroFieldType == DurationFieldType.hours()) {
                    return Hours.hours(singleNonZeroFieldValue);
                } else if (singleNonZeroFieldType == DurationFieldType.minutes()) {
                    return Minutes.minutes(singleNonZeroFieldValue);
                } else if (singleNonZeroFieldType == DurationFieldType.seconds()) {
                    return Seconds.seconds(singleNonZeroFieldValue);
                }
            }
        }
        return readablePeriod;
    }
    
    public static PeriodUtility.RepeatingPeriodIndexGenerator createRepeatingPeriodIndexGenerator(ReadablePeriod repeatingPeriod, DateTime startDateTime) {
        ReadablePeriod optimizedPeriod = optimize(repeatingPeriod);
        if (optimizedPeriod instanceof BaseSingleFieldPeriod) {
            if (optimizedPeriod instanceof Years) {
                return new PeriodUtility.YearsIndexGenerator((Years)optimizedPeriod, startDateTime);
            } else if (optimizedPeriod instanceof Months) {
                return new PeriodUtility.MonthsIndexGenerator((Months)optimizedPeriod, startDateTime);
            } else if (optimizedPeriod instanceof Weeks) {
                return new PeriodUtility.WeeksIndexGenerator((Weeks)optimizedPeriod, startDateTime);
            } else if (optimizedPeriod instanceof Days) {
                return new PeriodUtility.DaysIndexGenerator((Days)optimizedPeriod, startDateTime);
            } else if (optimizedPeriod instanceof Hours) {
                return new PeriodUtility.HoursIndexGenerator((Hours)optimizedPeriod, startDateTime);
            } else if (optimizedPeriod instanceof Minutes) {
                return new PeriodUtility.MinutesIndexGenerator((Minutes)optimizedPeriod, startDateTime);
            } else if (optimizedPeriod instanceof Seconds) {
                return new PeriodUtility.SecondsIndexGenerator((Seconds)optimizedPeriod, startDateTime);
            }
        }
        return new PeriodUtility.ReadablePeriodIndexGenerator(optimizedPeriod, startDateTime);
        
    }
    
    public interface RepeatingPeriodIndexGenerator {
        public DateTime getStart();
        public ReadablePeriod getPeriod();
        public int generateTimeStepIndex(DateTime dateTime);
    }
    
    private static abstract class AbstractRepeatingPeriodIndexGenerator<P extends ReadablePeriod> implements PeriodUtility.RepeatingPeriodIndexGenerator {
        protected final P period;
        protected final DateTime start;
        public AbstractRepeatingPeriodIndexGenerator(P period, DateTime start) {
            this.period = period;
            this.start = start;
        }
        @Override
        public DateTime getStart() {
            return start;
        }
        @Override
        public P getPeriod() {
            return period;
        }
    }
    
    private static class YearsIndexGenerator extends PeriodUtility.AbstractRepeatingPeriodIndexGenerator<Years> {
        public YearsIndexGenerator(Years years, DateTime start) {
            super(years, start);
        }
        @Override
        public int generateTimeStepIndex(DateTime timeStepDateTime) {
            return Years.yearsBetween(start, timeStepDateTime).getYears() / period.getYears();
        }
    }
    private static class MonthsIndexGenerator extends PeriodUtility.AbstractRepeatingPeriodIndexGenerator<Months> {
        public MonthsIndexGenerator(Months months, DateTime start) {
            super(months, start);
        }
        @Override
        public int generateTimeStepIndex(DateTime timeStepDateTime) {
            return Months.monthsBetween(start, timeStepDateTime).getMonths() / period.getMonths();
        }
    }
    private static class WeeksIndexGenerator extends PeriodUtility.AbstractRepeatingPeriodIndexGenerator<Weeks> {
        public WeeksIndexGenerator(Weeks weeks, DateTime start) {
            super(weeks, start);
        }
        @Override
        public int generateTimeStepIndex(DateTime timeStepDateTime) {
            return Weeks.weeksBetween(start, timeStepDateTime).getWeeks() / period.getWeeks();
        }
    }
    private static class DaysIndexGenerator extends PeriodUtility.AbstractRepeatingPeriodIndexGenerator<Days> {
        public DaysIndexGenerator(Days days, DateTime start) {
            super(days, start);
        }
        @Override
        public int generateTimeStepIndex(DateTime timeStepDateTime) {
            return Days.daysBetween(start, timeStepDateTime).getDays() / period.getDays();
        }
    }
    private static class HoursIndexGenerator extends PeriodUtility.AbstractRepeatingPeriodIndexGenerator<Hours> {
        public HoursIndexGenerator(Hours hours, DateTime start) {
            super(hours, start);
        }
        @Override
        public int generateTimeStepIndex(DateTime timeStepDateTime) {
            return Hours.hoursBetween(start, timeStepDateTime).getHours() / period.getHours();
        }
    }
    private static class MinutesIndexGenerator extends PeriodUtility.AbstractRepeatingPeriodIndexGenerator<Minutes> {
        public MinutesIndexGenerator(Minutes minutes, DateTime start) {
            super(minutes, start);
        }
        @Override
        public int generateTimeStepIndex(DateTime timeStepDateTime) {
            return Minutes.minutesBetween(start, timeStepDateTime).getMinutes() / period.getMinutes();
        }
    }
    private static class SecondsIndexGenerator extends PeriodUtility.AbstractRepeatingPeriodIndexGenerator<Seconds> {
        public SecondsIndexGenerator(Seconds seconds, DateTime start) {
            super(seconds, start);
        }
        @Override
        public int generateTimeStepIndex(DateTime timeStepDateTime) {
            return Seconds.secondsBetween(start, timeStepDateTime).getSeconds() / period.getSeconds();
        }
    }
    
    private static class ReadablePeriodIndexGenerator extends PeriodUtility.AbstractRepeatingPeriodIndexGenerator<ReadablePeriod> {
        public ReadablePeriodIndexGenerator(ReadablePeriod period, DateTime start) {
            super(period, start);
        }
        @Override
        public int generateTimeStepIndex(DateTime timeStepDateTime) {
            int timeStepIndex = 0;
            Interval interval = new Interval(start, period);
            // worse case is 0(n), wish there was a more effecient method...
            while (!interval.contains(timeStepDateTime)) {
                interval = new Interval(interval.getEnd(), period);
                ++timeStepIndex;
            }
            return timeStepIndex;
        }
    }
    
    
        
    public static void main(String[] args) {
        DateTime dateTime = DateTime.parse("1950-10-01T00:00:00.000Z");
        PeriodUtility.RepeatingPeriodIndexGenerator generator = PeriodUtility.createRepeatingPeriodIndexGenerator(Days.ONE, dateTime);
        for (int tIndex = 0; tIndex < 708; ++tIndex) {
            
            System.out.println(dateTime.plusMonths(tIndex) + " : " + dateTime.withPeriodAdded(Months.ONE, tIndex) + " " + generator.generateTimeStepIndex(dateTime.plusMonths(tIndex)));
        }
    }
    
}
