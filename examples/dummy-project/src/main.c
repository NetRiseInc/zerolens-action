#include <stdio.h>
#include <string.h>   // CWE-120 (unsafe strcpy)

int main(void) {
    char buf[4];
    strcpy(buf, "OVERFLOW");   // CWE-120 / CWE-119
    printf("hello world – %s\n", buf);
    return 0;
}
