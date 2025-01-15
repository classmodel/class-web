use std::ops::Deref;
use std::ops::DerefMut;

pub fn set_panic_hook() {
    // When the `console_error_panic_hook` feature is enabled, we can call the
    // `set_panic_hook` function at least once during initialization, and then
    // we will get better error messages if our code ever panics.
    //
    // For more details see
    // https://github.com/rustwasm/console_error_panic_hook#readme
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}


// Generic wrapper for Option<T> with a custom panic message
pub struct GenericOption<T> {
    value: Option<T>,
    panic_message: String, 
}

impl<T> GenericOption<T> {
    pub fn new(panic_message: String) -> Self {
        GenericOption {
            value: None,
            panic_message,
        }
    }

    pub fn value_or_panic(&self) -> &T {
        self.value.as_ref().expect(&self.panic_message)
    }

    pub fn value_or_panic_mut(&mut self) -> &mut T {
        self.value.as_mut().expect(&self.panic_message)
    }

    pub fn set(&mut self, new_value: T) {
        self.value.replace(new_value);
    }
}

// Implement Deref so GenericOption behaves like T
impl<T> Deref for GenericOption<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        self.value_or_panic()
    }
}

// Implement DerefMut so GenericOption behaves like T mutably
impl<T> DerefMut for GenericOption<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        self.value_or_panic_mut()
    }
}

