import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Types "../types/exchangerates";

module {
  public type ExchangeRateEntry = Types.ExchangeRateEntry;

  public func saveRates(
    store : Map.Map<Text, Map.Map<Text, ExchangeRateEntry>>,
    caller : Principal,
    rates : [ExchangeRateEntry],
  ) : () {
    Runtime.trap("not implemented");
  };

  public func getRates(
    store : Map.Map<Text, Map.Map<Text, ExchangeRateEntry>>,
    caller : Principal,
  ) : [ExchangeRateEntry] {
    Runtime.trap("not implemented");
  };
};
