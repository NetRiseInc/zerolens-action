#include <stdio.h>
#include <string.h> // CWE-120 (unsafe strcpy) and CWE-676 (dangerous strcat)

int main(void)
{
    char buf[4];
    strcpy(buf, "OVERFLOW"); // CWE-120 / CWE-119

    char msg[32] = "Hello ";
    strcat(msg, buf); // CWE-676 – dangerous strcat

    printf("hello world – %s\n", msg);
    return 0;
}
