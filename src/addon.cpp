#include <napi.h>
#include <string>
#include <cmath>
#include <stdexcept>

// ─── add(a, b): number ────────────────────────────────────────────────────────
Napi::Value Add(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber())
    throw Napi::TypeError::New(env, "add() expects two numbers");

  double a = info[0].As<Napi::Number>().DoubleValue();
  double b = info[1].As<Napi::Number>().DoubleValue();
  return Napi::Number::New(env, a + b);
}

// ─── greet(name): string ─────────────────────────────────────────────────────
Napi::Value Greet(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsString())
    throw Napi::TypeError::New(env, "greet() expects a string");

  std::string name = info[0].As<Napi::String>().Utf8Value();
  return Napi::String::New(env, "Hello from C++ Node-Addon-API, " + name + "!");
}

// ─── fibonacci(n): number ────────────────────────────────────────────────────
Napi::Value Fibonacci(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsNumber())
    throw Napi::TypeError::New(env, "fibonacci() expects a number");

  int n = info[0].As<Napi::Number>().Int32Value();
  if (n < 0) throw Napi::RangeError::New(env, "fibonacci() argument must be >= 0");

  long long a = 0, b = 1;
  for (int i = 2; i <= n; ++i) { long long t = a + b; a = b; b = t; }
  return Napi::Number::New(env, n == 0 ? 0.0 : static_cast<double>(b));
}

// ─── createPoint(x, y): object ───────────────────────────────────────────────
Napi::Value CreatePoint(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber())
    throw Napi::TypeError::New(env, "createPoint() expects two numbers");

  double x = info[0].As<Napi::Number>().DoubleValue();
  double y = info[1].As<Napi::Number>().DoubleValue();

  Napi::Object obj = Napi::Object::New(env);
  obj.Set("x", Napi::Number::New(env, x));
  obj.Set("y", Napi::Number::New(env, y));
  obj.Set("distanceFromOrigin", Napi::Number::New(env, std::sqrt(x * x + y * y)));
  return obj;
}

// ─── Counter class (ObjectWrap example) ──────────────────────────────────────
class Counter : public Napi::ObjectWrap<Counter> {
public:
  static Napi::Function GetClass(Napi::Env env) {
    return DefineClass(env, "Counter", {
      InstanceMethod("increment", &Counter::Increment),
      InstanceMethod("decrement", &Counter::Decrement),
      InstanceMethod("reset",     &Counter::Reset),
      InstanceAccessor("value",   &Counter::GetValue, nullptr),
    });
  }

  Counter(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<Counter>(info), value_(0) {
    if (info.Length() > 0 && info[0].IsNumber())
      value_ = info[0].As<Napi::Number>().Int32Value();
  }

private:
  int value_;

  Napi::Value Increment(const Napi::CallbackInfo& info) {
    int step = (info.Length() > 0 && info[0].IsNumber())
               ? info[0].As<Napi::Number>().Int32Value() : 1;
    value_ += step;
    return Napi::Number::New(info.Env(), value_);
  }

  Napi::Value Decrement(const Napi::CallbackInfo& info) {
    int step = (info.Length() > 0 && info[0].IsNumber())
               ? info[0].As<Napi::Number>().Int32Value() : 1;
    value_ -= step;
    return Napi::Number::New(info.Env(), value_);
  }

  Napi::Value Reset(const Napi::CallbackInfo& info) {
    value_ = 0;
    return info.Env().Undefined();
  }

  Napi::Value GetValue(const Napi::CallbackInfo& info) {
    return Napi::Number::New(info.Env(), value_);
  }
};

// ─── Module init ─────────────────────────────────────────────────────────────
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("add",         Napi::Function::New(env, Add));
  exports.Set("greet",       Napi::Function::New(env, Greet));
  exports.Set("fibonacci",   Napi::Function::New(env, Fibonacci));
  exports.Set("createPoint", Napi::Function::New(env, CreatePoint));
  exports.Set("Counter",     Counter::GetClass(env));
  return exports;
}

NODE_API_MODULE(addon, Init)
